# Плагин NyaCord для Vencord

Иногда дописывает случайную приписку (`~Няя~` и другие) к отправляемым сообщениям.
Вкл/выкл кнопкой рядом с полем ввода, настройки: Настройки -> Vencord -> NyaCord.

## Установка

Нужны `git`, Node.js LTS и `pnpm` (`npm i -g pnpm`, если нет).

```powershell
git clone https://github.com/Vendicated/Vencord.git
cd Vencord
pnpm i --frozen-lockfile
# скопировать папку nyaCord
Copy-Item -Recurse ..\nyaCord .\src\userplugins\
pnpm build
pnpm inject   # выбери Discord с VenCord'om -> Inject
```

Если инсталлятор скажет, что файлы Discord заняты: `taskkill /f /im discord.exe`.

Запуск Discord -> Настройки -> раздел Vencord (иконка внизу списка настроек) -> Plugins -> включи галочку Enable у NyaCord.

## Обновление после правок кода

```powershell
pnpm build
```

и перезапуск Discord (Настройки → Vencord → Restart Client, или Ctrl+R).
