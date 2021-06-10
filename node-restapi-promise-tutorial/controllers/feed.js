const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');
const Posts = require('../models/post');
const { post } = require('../routes/feed');

//implement async and await
exports.getPosts = async (req, res, next) => {
  try {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let skip = (currentPage - 1) * perPage
    let limit = perPage;
    let totalArray = await Posts.postCount();
    const totalItems = totalArray[0][0].numRows;
    let postsArray = await Posts.fetchAll(limit, skip);
    const postItems = postsArray[0];
    res.status(200).json({
      message: 'Fetched posts successfully.',
      posts: postItems,
      totalItems: totalItems
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getPosts = (req, res, next) => {
//   const currentPage = req.query.page || 1;
//   const perPage = 2;
//   let skip = (currentPage - 1) * perPage
//   let limit = perPage;
//   let totalItems;
//   Posts.postCount()
//     .then(([rows, fieldData]) => {
//       console.log('1');
//       totalItems = rows[0].numRows;
//       return Posts.fetchAll(limit, skip)
//     })
//     .then(([rows, fieldData]) => {
//       console.log(2);
//       res.status(200).json({
//         message: 'Fetched posts successfully.',
//         posts: rows,
//         totalItems: totalItems
//       })
//     })
//     .catch(err => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
//     console.log(3);
// };

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Posts.findById(postId)
    .then(([rows, fieldData]) => {
      if (!rows) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched.', post: rows[0] });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  const creator = 'Rafeeq';
  const createdAt = new Date();
  const userId = req.userId;
  const post = new Posts(null, title, content, creator, createdAt, imageUrl, userId);
  let insertedPostId;
  post.save()
    .then((result) => {
      insertedPostId = result[0].insertId;
      res.status(201).json({
        message: 'Post created successfully!',
        post: {
          id: insertedPostId,
          title: title,
          content: content,
          creator: 'Mohamed',
          createdAt: createdAt,
          imageUrl: imageUrl
        }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  const creator = 'Rafeeq';
  const createdAt = new Date();
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  Posts.findById(postId)
    .then(([rows, fieldData]) => {
      if (!rows) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      if (req.userId != rows[0].user_id) {
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== rows[0].imageUrl) {
        clearImage(rows[0].imageUrl);
      }
      const post = new Posts(postId, title, content, creator, createdAt, imageUrl);
      return post.update();
    })
    .then((result) => {
      res.status(200).json({
        message: 'Post updated!',
        post: {
          id: parseInt(postId),
          title: title,
          content: content,
          creator: creator,
          createdAt: new Date(),
          imageUrl: imageUrl
        }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Posts.findById(postId)
    .then(([rows, fieldData]) => {
      if (!rows) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      console.log('bow', rows[0].user_id);
      console.log('biv', req.userId);
      if (req.userId != rows[0].user_id) {
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }
      clearImage(rows[0].imageUrl);
      return Posts.delete(postId);
    })
    .then(result => {
      res.status(200).json({
        message: 'Post Deleted'
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => {
    console.log(err)
  });
}