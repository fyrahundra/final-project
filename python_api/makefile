# Name of your container
CONTAINER_NAME=python_api_container
IMAGE_NAME=python-runner
RUNNER_IMAGE=python-sandbox-runner
RUNNER_DOCKERFILE=runner.dockerfile

# CPU and memory limits
CPUS=.5
MEMORY=200m
WORKER_CONCURRENCY=4
MAX_QUEUE_LENGTH=16
RUN_TIMEOUT_SECONDS=5
RUN_MEMORY_LIMIT=128m
RUN_CPU_LIMIT=.5
RUN_PIDS_LIMIT=32
STDOUT_LIMIT=8192
STDERR_LIMIT=8192

.PHONY: build build-runner run stop restart test-policy

build:
	docker build -t $(IMAGE_NAME) .

build-runner:
	docker build -f $(RUNNER_DOCKERFILE) -t $(RUNNER_IMAGE) .

stop:
	@echo "Stopping container if it exists..."
	-@powershell -Command "$$containerId = docker ps -a -q -f name=$(CONTAINER_NAME); if ($$containerId) { docker rm -f $(CONTAINER_NAME) } else { Write-Output 'Container not running or already removed.' }"

run: build build-runner stop
	@echo "Running container..."
	docker run -d --name $(CONTAINER_NAME) -p 8000:8000 --cpus=$(CPUS) --memory=$(MEMORY) \
		--group-add 0 \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-e WORKER_CONCURRENCY=$(WORKER_CONCURRENCY) \
		-e MAX_QUEUE_LENGTH=$(MAX_QUEUE_LENGTH) \
		-e RUN_TIMEOUT_SECONDS=$(RUN_TIMEOUT_SECONDS) \
		-e RUN_MEMORY_LIMIT=$(RUN_MEMORY_LIMIT) \
		-e RUN_CPU_LIMIT=$(RUN_CPU_LIMIT) \
		-e RUN_PIDS_LIMIT=$(RUN_PIDS_LIMIT) \
		-e RUNNER_IMAGE=$(RUNNER_IMAGE) \
		-e STDOUT_LIMIT=$(STDOUT_LIMIT) \
		-e STDERR_LIMIT=$(STDERR_LIMIT) \
		$(IMAGE_NAME)

restart: stop run

test-policy:
	python policy_regression_test.py