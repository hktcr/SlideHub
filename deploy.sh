#!/bin/bash
# Deploy SlideHub to GitHub Pages

echo "=== Bygger och publicerar SlideHub ==="
echo ""

# Kontrollera om git är initierat
if [ ! -d ".git" ]; then
    echo "Initierar git-repo för SlideHub..."
    git init
    git branch -M main
    git remote add origin git@github.com:hktcr/SlideHub.git 2>/dev/null || echo "Remote finns redan"
fi

# Lägg till alla filer (inkl index.html och presentationerna)
git add -A
git commit -m "Automatisk publicering från gAIa: $(date '+%Y-%m-%d %H:%M')"

echo "Pushar till GitHub (hktcr/SlideHub)..."
# Tryck upp koden. Ändra main till branch namnet om github pages använder gh-pages gren.
git push -u origin main

echo ""
echo "✅ Klart! SlideHub är publicerad."
echo "Din portal finns snart på: https://hktcr.github.io/SlideHub/"
