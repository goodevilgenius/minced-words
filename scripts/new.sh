#!/usr/bin/env bash

OPEN=$(which xdg-open)
[ -z "$OPEN" ] && OPEN=$(which c9)
[ -z "$OPEN" -a "$(uname -s)" = "Darwin" ] && OPEN=$(which open)
[ -z "$OPEN" ] && OPEN=echo

DATE=$(date +%Y-%m-%d)
TITLE="$1"
[ -z "$TITLE" ] && TITLE="New Title"
SLUG=$(echo "$TITLE" | sed -E -e 's/ +/-/g' -e 's/[^A-Za-z0-9-]//g' | tr A-Z a-z)
FILE=_posts/${DATE}-${SLUG}.yml
let i=0

while [ -f "$FILE" ]; do
    let i++
    FILE=_posts/${DATE}-${SLUG}-${i}.yml
done

echo "File: $FILE"

cat > $FILE <<EOF
title: $TITLE
date: $DATE
description: 
EOF

$OPEN "$FILE"
