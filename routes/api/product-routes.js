const router = require('express').Router();
const { json } = require('sequelize');
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(productData);
  } catch (error) {
    res.status(500).json(error);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }],
    });
    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    };
    res.status(200).json(productData);
  } catch (error) {
    res.status(500).json(error);
  }
});

// create new product
router.post('/', async (req, res) => {

  try {
    const productData = await Product.create(req.body);

    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: productData.id,
          tag_id,
        };
      });
      return ProductTag.bulkCreate(productTagIdArr);
    };

    res.status(200).json(productData);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});

// update product
router.put('/:id', async (req, res) => {

    /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */

  try {
    const productData = await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    if (req.body.tagIds && req.body.tagIds.length) {
      // Get the current product tags
      const productTags = await ProductTag.findAll({
        where: {
          product_id: req.params.id,
        },
      });

      // Create a filtered list of new tag_ids
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map((tag_id) => ({
          product_id: req.params.id,
          tag_id,
        }));

      // Figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // Run both actions
      const [destroyedTags, createdTags] = await Promise.all([
        ProductTag.destroy({
          where: {
            id: productTagsToRemove,
          },
        }),
        ProductTag.bulkCreate(newProductTags)
      ])
    };

    res.status(200).json(productData);

  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    };
    res.status(200).json(productData);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
