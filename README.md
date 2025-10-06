# Nitro: A markup language which compiles to HTML

## Requirements: node and npm installed.

## Usage
First, go into the project directory and then:
```
nitro compile FILE_NAME.nitro
```
The compiled HTML file will be written to build/index.html

## Example
Here is a basic example usage of Nitro
```
[tag = title, colour = red]
    Hello world!
[!tag = title]
```

## Installation (Linux)
```sh
git clone https://github.com/TheBrainy06/nitro.git
cd nitro

npm install
sudo npm install -g
```
