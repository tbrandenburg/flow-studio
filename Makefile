.DEFAULT_GOAL := build

.PHONY: install lint format test build run release

install: node_modules/.package-lock.json

node_modules/.package-lock.json: package.json package-lock.json
	npm ci

lint: install
	npm run lint

format: install
	npm run format

test: install
	npm run test

build: lint
	npm run build

run: install
	npm run dev

# Usage: make release BUMP=patch|minor|major
release: BUMP ?=
release: test build
	@case "$(BUMP)" in \
		patch|minor|major) ;; \
		*) echo "Usage: make release BUMP=patch|minor|major"; exit 1 ;; \
	esac
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Working tree is not clean, commit or stash changes first."; exit 1; \
	fi
	npm version $(BUMP) -m "chore(release): v%s"
	git push && git push --tags
	gh release create "$$(git describe --tags --abbrev=0)" --generate-notes
