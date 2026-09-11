.DEFAULT_GOAL := build

.PHONY: install lint format test build run

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
