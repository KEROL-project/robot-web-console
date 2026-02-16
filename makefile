init:
	pip install -r requirements.txt
lint:
	python3 -m flake8 .
format:
	black .
	make lint
serve:
	python3 craft serve
