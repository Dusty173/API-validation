const express = require("express");
const Book = require("../models/book");
const { validate } = require('jsonschema');
const newBookSchema = require('../schemas/newBookSchema.json');
const updateBookSchema = require('../schemas/updateBookSchema.json');

const router = new express.Router();


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    const validation = validate(req.body, newBookSchema);
    if(!validation.valid){
      return next({
        status: 400,
        error: validation.errors.map(err => err.stack)
      });
    }
    const book = await Book.create(req.body);
    return res.status(201).json({book});
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    if("isbn" in req.body){
      return next({
        status: 400,
        message: "ISBN cannot be sent within body of update request!"
      })
    }
    const validation = validate(req.body, updateBookSchema);
    if(!validation.valid){
      return next({
        status: 400,
        errors: validation.errors.map(err => err.stack)
      });
    }

    const book = await Book.update(req.params.isbn, req.body);
    return res.json({book});

  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
