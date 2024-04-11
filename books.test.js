process.env.NODE_ENV = "test"

const request = require("supertest");
const app = require("./app");
const db = require("./db");

let isbn;

beforeEach(async () => {
    let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
          '12',
          'http://google.com',
          'JLD',
          'English',
          1000,
          'Publisher Guy',
          'A book about books', 
          2024
        ) RETURNING isbn`);
  
    isbn = result.rows[0].isbn
});

afterEach(async () => {
    await db.query("DELETE FROM BOOKS");
});

afterAll(async () => {
    await db.end()
});
  

describe("GET /books", () => {
    test("Gets a list of existing books (1)", async () => {
        const response = await request(app).get(`/books`);
        const books = response.body.books;

        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("year");
    });
});

describe("GET /books/:isbn", () => {
    test("Gets book by isbn", async () => {
        const response = await request(app).get(`/books/${isbn}`)

        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(isbn);
    });
  
    test("Responds 404 if isbn does not exist", async () => {
        const response = await request(app).get(`/books/1234567`)

        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /books/:isbn", () => {
    test("Updates specific book", async () => {
        const response = await request(app).put(`/books/${isbn}`).send({
            amazon_url: "http://google.com",
            author: "JLD",
            language: "english",
            pages: 1000,
            publisher: "Publisher Guy",
            title: "Updated title",
            year: 2027
        });
      
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("Updated title");
    });
  
    test("Denies update if isbn in req.body", async () => {
        const response = await request(app).put(`/books/${isbn}`).send({
            isbn: "1234567",
            amazon_url: "http://google.com",
            author: "JLD",
            language: "english",
            pages: 1000,
            publisher: "Publisher Guy",
            title: "Updated 2 title",
            year: 2040
        });

        expect(response.statusCode).toBe(400);
    });
  
    test("Responds 404 if isbn doesn't exist", async () => {
        await request(app).delete(`/books/${isbn}`)

        const response = await request(app).delete(`/books/${isbn}`);
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /books/:isbn", () => {
    test("Deletes specific book", async () => {
        const response = await request(app).delete(`/books/${isbn}`)

        expect(response.body).toEqual({message: "Book deleted"});
    });
});
