FROM php:8.1-apache

# Apache
RUN a2enmod rewrite

# Dépendances système
RUN apt-get update && apt-get install -y \
    libmariadb-dev \
    && docker-php-ext-install pdo pdo_mysql

# Nettoyage
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
