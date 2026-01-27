.PHONY: up down apache-deploy import-db help

up:
	@echo "Starting services via docker-compose..."
	docker compose -f docker-compose.yml up -d

down:
	@echo "Stopping services..."
	docker compose -f docker-compose.yml down

apache-deploy:
	@echo "Syncing project to /var/www/html (requires sudo)..."
	sudo rsync -a --delete ./ /var/www/html/
	sudo chown -R www-data:www-data /var/www/html/frontend/src/app/public

import-db:
	@echo "Import SQL/backend.sql into local MySQL (adjust user/password)..."
	mysql -u root -prootpass eseo_db < SQL/backend.sql

help:
	@echo "Targets: up, down, apache-deploy, import-db"
