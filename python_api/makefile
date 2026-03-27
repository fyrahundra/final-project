# Name of your container
CONTAINER_NAME=python_api_container
IMAGE_NAME=python-runner

# CPU and memory limits
CPUS=.5
MEMORY=200m

.PHONY: build run stop restart

build:
	docker build -t $(IMAGE_NAME) .

stop:
	@echo "Stopping container if it exists..."
	-@powershell -Command "$$containerId = docker ps -a -q -f name=$(CONTAINER_NAME); if ($$containerId) { docker rm -f $(CONTAINER_NAME) } else { Write-Output 'Container not running or already removed.' }"

run: build stop
	@echo "Running container..."
	docker run -d --name $(CONTAINER_NAME) -p 8000:8000 --cpus=$(CPUS) --memory=$(MEMORY) $(IMAGE_NAME)

restart: stop run