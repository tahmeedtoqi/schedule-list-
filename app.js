//jshint esversion:8

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Updated MongoDB connection with async/await

async function connectDB() {
  try {
    const uri = "mongodb+srv://admin:admin@cluster0.frgcn.mongodb.net/todolistdb?retryWrites=true&w=majority";
    await mongoose.connect(uri, {
      useNewUrlParser: true
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
connectDB();


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB.");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndDelete(checkedItemId);
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
