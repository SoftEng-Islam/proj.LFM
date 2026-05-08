#!/usr/bin/env bash

# LFM Project Doctor
# Checks system dependencies for developing LFM (Tauri + Vue)

set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NODE_MIN_VERSION="20.19.0"
PNPM_MIN_VERSION="10.14.0"
RUST_MIN_VERSION="1.75.0"

pass_count=0
warn_count=0
fail_count=0

say() { echo -e "$1"; }
pass() { ((pass_count++)); say "${GREEN}PASS${NC}  $1"; }
warn() { ((warn_count++)); say "${YELLOW}WARN${NC}  $1"; }
fail() { ((fail_count++)); say "${RED}FAIL${NC}  $1"; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

version_ge() {
    local found=$1
    local needed=$2
    if [ "$(printf '%s\n' "$needed" "$found" | sort -V | head -n1)" = "$needed" ]; then
        return 0
    else
        return 1
    fi
}

say "🔍 LFM System Diagnostics"
say "========================"

# 1. Node.js & pnpm
if has_cmd node; then
    node_v=$(node -v | sed 's/v//')
    if version_ge "$node_v" "$NODE_MIN_VERSION"; then
        pass "Node.js $node_v (>= $NODE_MIN_VERSION)"
    else
        fail "Node.js $node_v is too old (need >= $NODE_MIN_VERSION)"
    fi
else
    fail "Node.js is not installed"
fi

if has_cmd pnpm; then
    pnpm_v=$(pnpm -v)
    if version_ge "$pnpm_v" "$PNPM_MIN_VERSION"; then
        pass "pnpm $pnpm_v (>= $PNPM_MIN_VERSION)"
    else
        fail "pnpm $pnpm_v is too old (need >= $PNPM_MIN_VERSION)"
    fi
else
    fail "pnpm is not installed"
fi

# 2. Rust Toolchain
if has_cmd rustc; then
    rust_v=$(rustc --version | awk '{print $2}')
    if version_ge "$rust_v" "$RUST_MIN_VERSION"; then
        pass "Rust $rust_v (>= $RUST_MIN_VERSION)"
    else
        fail "Rust $rust_v is too old (need >= $RUST_MIN_VERSION)"
    fi
else
    fail "Rust is not installed. Install via: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi

if has_cmd cargo; then
    pass "Cargo is installed"
else
    fail "Cargo is not installed"
fi

# 3. Tauri CLI
if has_cmd pnpm; then
    if pnpm list -g @tauri-apps/cli >/dev/null 2>&1 || [ -f "./node_modules/.bin/tauri" ]; then
        pass "Tauri CLI is available"
    else
        warn "Tauri CLI not found globally. It will run via 'pnpm run tauri'"
    fi
fi

# 4. Linux System Dependencies (Tauri 2)
say "\n📦 Checking Linux System Libraries (for development)..."

check_pkg() {
    if has_cmd pkg-config && pkg-config --exists "$1"; then
        pass "Library found: $1"
    else
        warn "Library missing or pkg-config cannot find: $1"
    fi
}

DEPS=("webkit2gtk-4.1" "gtk+-3.0" "libayatana-appindicator3-0.1" "librsvg-2.0")
for dep in "${DEPS[@]}"; do
    check_pkg "$dep"
done

if ! has_cmd pkg-config; then
    fail "pkg-config is not installed. Required to find system libraries."
fi

# 5. Local Setup
say "\n📂 Checking Project Setup..."
if [ -d "node_modules" ]; then
    pass "node_modules found"
else
    warn "node_modules missing. Run 'pnpm install'"
fi

if [ -f ".env" ]; then
    pass ".env file found"
else
    warn ".env file missing. Some features might need configuration."
fi

# Summary
say "\n📋 Summary"
say "----------"
say "PASS: $pass_count"
say "WARN: $warn_count"
say "FAIL: $fail_count"

if [ "$fail_count" -gt 0 ]; then
    say "\n${RED}Please fix the failures above to ensure LFM builds correctly.${NC}"
    exit 1
else
    say "\n${GREEN}System is ready for LFM development!${NC}"
    exit 0
fi
