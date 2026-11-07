import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { addMessagePreSendListener, MessageSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { IconComponent, OptionType } from "@utils/types";
import { React, useEffect, useState } from "@webpack/common";

const log = new Logger("NyaCord");

// toggle state + msg counter, survive channel switch rerenders
let enabled = false;
let sinceLast = 0;

const settings = definePluginSettings({
    suffixes: {
        type: OptionType.STRING,
        description: "Приписки в формате JSON: {\"текст\": вес, ...} где вес = относительная частота",
        default: '{ "~Няя~": 5, "~мурр~": 3, "nya~": 2, "~мяу~": 2, "~пурр~": 1 }'
    },
    template: {
        type: OptionType.STRING,
        description: 'Формат приписки: {suffix} заменится на выбранную приписку (можно не раз)',
        default: " {suffix}",
        placeholder: " {suffix}"
    },
    minInterval: {
        type: OptionType.NUMBER,
        description: "Минимум обычных сообщений между приписками",
        default: 2,
        placeholder: "0 = можно через каждое"
    },
    chance: {
        type: OptionType.SLIDEBAR,
        description: "Шанс приписки, когда кулдаун прошёл (%)",
        markers: [...Array(21)].map((_, i) => i * 5),
        default: 40,
        stickToMarkers: false
    }
});

/** parse suffixes setting into {text, weight} list */
function parseSuffixes(): { text: string; weight: number }[] {
    try {
        const obj = JSON.parse(settings.store.suffixes) as Record<string, string | number>;
        return Object.entries(obj)
            .map(([text, weight]) => ({ text: text.trim(), weight: Math.max(0, Number(weight) || 0) }))
            .filter(e => e.text && e.weight > 0);
    } catch (e) {
        // dont throw, just no suffix till json gets fixed
        log.error("Не удалось разобрать список приписок (исправь JSON в настройках NyaCord):", e);
        return [];
    }
}

/** weighted random pick, biger weight wins more often */
function pick(list: { text: string; weight: number }[]): string {
    let roll = Math.random() * list.reduce((sum, e) => sum + e.weight, 0);
    for (const e of list) {
        roll -= e.weight;
        if (roll < 0) return e.text;
    }
    return list[0].text;
}

const NyaIcon: IconComponent = ({ height, width, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" className={className}>
        // paw = palm + 3 toe circles
        <circle cx={9} cy={4.5} r={2} fill="currentColor" />
        <circle cx={14.5} cy={3.5} r={2} fill="currentColor" />
        <circle cx={19} cy={6.5} r={2} fill="currentColor" />
        <path fill="currentColor" d="M12 8c3.5 0 8 3 8 6.5 0 2.3-1.8 3.5-4 3.5-1.5 0-2.7-.5-4-.5s-2.5.5-4 .5c-2.2 0-4-1.2-4-3.5C4 11 8.5 8 12 8Z" />
    </svg>
);

const NyaToggle: ChatBarButtonFactory = ({ isMainChat }) => {
    const [on, setOn] = useState(enabled);

    // whan toggled on: count msgs, w8 cooldown, roll chance, add weighted suffix
    useEffect(() => {
        setOn(enabled);
        const listener: MessageSendListener = (_, msg) => {
            if (!enabled) return;
            if (++sinceLast <= settings.store.minInterval) return;
            if (Math.random() * 100 > settings.store.chance) return;

            const list = parseSuffixes();
            if (list.length) {
                sinceLast = 0;
                // build final piece: {suffix} -> picked suffix, fallback append
                const MARK = "{suffix}";
                const tpl = settings.store.template;
                const piece = tpl.includes(MARK) ? tpl.replaceAll(MARK, pick(list)) : tpl + pick(list);
                msg.content += piece;
            }
        };

        addMessagePreSendListener(listener);
        return () => void removeMessagePreSendListener(listener);
    }, [on]);

    if (!isMainChat) return null; // only normal chats

    return (
        <ChatBarButton
            tooltip={`Ня-режим: ${on ? "ВКЛ" : "ВЫКЛ"}`}
            onClick={() => setOn(v => (enabled = !v))}
        >
            <span style={{ scale: "1.3", cursor: "pointer", userSelect: "none", fontSize: on ? "18px" : "14px" }}>
                {on ? "🐾" : "🐱"}
            </span>
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "NyaCord",
    description: "Иногда дописывает случайную приписку к отправляемым сообщениям, с настраиваемым кулдауном и общим шансом. Список приписок задаётся в JSON с весами. Тумблер в панели ввода.",
    authors: [{ id: 636178614739664907n, name: "sunkem_1" }],
    settings,
    chatBarButton: {
        icon: NyaIcon,
        render: NyaToggle
    }
});
