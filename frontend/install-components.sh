#!/bin/bash
# HealthGuard Component Installation Script
# This script copies all HealthGuard components to your project

echo "🚀 Installing HealthGuard Components..."

# Source and destination paths
SRC="/mnt/user-data/outputs/healthguard-components"
DEST="C:/Sahil/Projects/KnowledgeExtractor/frontend/src"

# Function to copy file with Windows path
copy_file() {
    local src_file="$1"
    local dest_file="$2"
    cat "$src_file" > "$dest_file" 2>/dev/null && echo "✅ Copied: $(basename $src_file)" || echo "❌ Failed: $(basename $src_file)"
}

echo ""
echo "📦 Copying components..."
for file in "$SRC/components"/*.tsx; do
    filename=$(basename "$file")
    copy_file "$file" "$DEST/components/healthguard/$filename"
done

for file in "$SRC/components"/*.ts; do
    filename=$(basename "$file")
    copy_file "$file" "$DEST/components/healthguard/$filename"
done

echo ""
echo "📝 Copying types..."
for file in "$SRC/types"/*.ts; do
    filename=$(basename "$file")
    copy_file "$file" "$DEST/types/healthguard/$filename"
done

echo ""
echo "🎨 Copying styles..."
mkdir -p "$DEST/styles/healthguard" 2>/dev/null
copy_file "$SRC/styles/globals.css" "$DEST/styles/healthguard/globals.css"

echo ""
echo "📚 Copying libraries..."
mkdir -p "$DEST/lib/healthguard" 2>/dev/null
for file in "$SRC/lib"/*.ts; do
    filename=$(basename "$file")
    copy_file "$file" "$DEST/lib/healthguard/$filename"
done

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd C:/Sahil/Projects/KnowledgeExtractor/frontend"
echo "2. npm install lucide-react"
echo "3. Update tailwind.config.ts (see HEALTHGUARD_INSTALLATION.md)"
echo "4. Import styles in app/layout.tsx"
echo ""
echo "🎉 All files ready!"
