# GitHub-Sync cheat sheet

Dieser Ordner dokumentiert die Terminalbefehle, mit denen du Änderungen aus diesem Projekt zu GitHub überträgst.

## 1. Änderungen prüfen

```bash
git status
```

Zeigt dir, welche Dateien geändert/neu sind. Das hilft vor jedem Commit, den Überblick zu behalten.

## 2. Dateien zum Commit vormerken

```bash
git add .
```

Alternativ kannst du einzelne Pfade explizit angeben (z. B. `git add TypingGame`), wenn du nicht alles pushen willst.

## 3. Commit erstellen

```bash
git commit -m "Beschreibe kurz, was geändert wurde"
```

Wähle eine klare Message, damit du später wissen kannst, was sich in diesem Commit verbirgt.

## 4. Auf den Remote pushen

```bash
git push
```

Falls du den Remote noch nicht gesetzt hast, musst du ihn einmal hinzufügen:

```bash
git remote add origin https://github.com/<dein-user>/<dein-repo>.git
git branch -M main
git push -u origin main
```

## 5. Häufige Helfer

- `git pull` – holt neue Änderungen vom Remote.  
- `git log --oneline --graph --decorate` – zeigt Verlauf in kompakter Ansicht.  
- `git diff` – zeigt noch nicht gestagte Änderungen.

Füge hier gern weitere Notizen hinzu, wenn du später noch kürzere Workflows oder Skripte ergänzen möchtest.

## Copy-&-Paste-Sync

Du kannst alles in einem Zug hochladen, indem du diesen Block ausführst:

```bash
cd /workspaces/TheChatGPT_Project
git add .
git commit -m "Sync all projects"
git push
```

Wenn du noch keinen Remote hinterlegt hast oder dir Git eine neue Branch empfiehlt, ergänze vorher die Remote-URL (ersetze `github.com/...`):

```bash
git remote add origin https://github.com/<dein-user>/<dein-repo>.git
git branch -M main
git push -u origin main
```
