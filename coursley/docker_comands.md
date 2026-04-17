docker run --name db -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -e POSTGRES_DB=db -d -p 5432:5432 --rm postgres

docker exec -it db psql -U user -d db

# If the container was started without POSTGRES_DB=db, create it manually:

docker exec -it db psql -U user -d postgres -c "CREATE DATABASE db;"

docker stop db
