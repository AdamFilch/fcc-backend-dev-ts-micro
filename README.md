# Freecodecamp Backend Development API Certification

1. Timestamp Microservice
2. Request Header Parser Microservice
3. URL Shortener Microservice
4. Exercise Tracker
5. File Metadata Microservice

node index.js // npm run start

http://localhost:4529

DB Actions

3 Total Tables

CREATE TABLE SHORTURL_T (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    originalurl text
)

CREATE TABLE IF NOT EXISTS USER_T (
          _id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE
);


CREATE TABLE IF NOT EXISTS EXERCISE_T (
          exec_id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT,
          duration TEXT,
          date DATE,
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES USER_T(_id)
);