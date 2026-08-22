-- Runs once on first container start, alongside POSTGRES_DB=rocket.
-- The integration suite refuses to run against the development database, so
-- an isolated one has to exist.
CREATE DATABASE rocket_test;
