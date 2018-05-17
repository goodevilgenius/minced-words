export PATH := $(HOME)/bin:$(PATH):/usr/local/bin:./node_modules/.bin

POINT=$(shell echo $$((RANDOM%79+128512)) )
EMOJI=$(shell printf '%x' $(POINT) )

default: all

init:
	# install git-flow
	git flow init -d
	# install jq
	echo '' | jq .
	echo '' | yq . || pip install yq

prep:
	echo prep

build: prep
	echo build

deploy: build
	echo deploy

clean:
	echo clean

all: deploy clean
