create database chatbot;

use chatbot;

create table users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255)
);

create table conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  message TEXT,
  response TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

select * from users;
DESCRIBE users;
INSERT INTO users (username, password) VALUES ('teste', 'senha');
ALTER TABLE conversations ADD COLUMN sport VARCHAR(50) DEFAULT NULL;