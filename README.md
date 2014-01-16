# Manip

A library for manipulating nested data in a way reminiscent of [MongoDB's "Update Operators"](http://docs.mongodb.org/manual/reference/operator/update/) work (eg. `$set`, `$unset`, `$push` and `$inc`)".

The following operations are current supported:

 * $set
 * $unset
 * $push
 * $inc

Given a set of data, sometimes you want to be able to be able to modify deeply nested data without hard coding the path to that data or worring if the sub sub subdocument you want to add to already exists.

Take the following example:

```javascript
var jack = {
	eyes: 'blue',
	car: {
		ford: {
			wheels: 4,
			age: 3,
			color: 'blue'
		}
	}
};
```

I could increase the age of the car by one year

```javascript
manip(jack, {'$inc': {'car.ford.age': 1}}));
```
and now the data is:

```javascript
{
	eyes: 'blue',
	car: {
		ford: {
			wheels: 4,
			age: 4,
			color: 'blue'
		}
	}
}
```