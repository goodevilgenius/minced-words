export PATH := ./scripts:$(HOME)/bin:$(PATH):/usr/local/bin:./node_modules/.bin

POINT=$(shell echo $$((RANDOM%79+128512)) )
EMOJI=$(shell printf '%x' $(POINT) )

default: all

init:
	# install git-flow
	git flow init -d
	# install jq
	echo '' | jq .
	echo '' | yq . || pip install yq
	# install yarn (npm install -g yarn)
	yarn install

new-post:
	new.sh "$(TITLE)"

build:
	rm -rf build
	mkdir build
	node-sass --include-path ./node_modules scss/*.scss > build/app.css
	webpack
	node scripts/build.js

deploy: build
	echo deploy

clean:
	rm -rf build

all: deploy clean
