FROM php:8.1-apache

# Apache
RUN a2enmod rewrite

# Dépendances système
RUN apt-get update && apt-get install -y \
    libpq-dev \
    default-mysql-client \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
