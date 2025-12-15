#!/bin/bash
# KONOMI KONCEPTION - Build Script

echo "Building Konomi Konception..."
node build/assemble.js

# Copy to root
cp build/konomi-konception.html .

echo ""
echo "Output files:"
ls -la konomi-konception.html
echo ""
echo "To run: Open konomi-konception.html in any modern browser"
