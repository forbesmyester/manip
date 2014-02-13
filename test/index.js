/*jshint smarttabs:true */
(function (root, factory) {

	"use strict";

	if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('../index.js'),
			require('expect.js')
		);
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		throw "Not tested in AMD";
	} else {
		// Browser globals (root is window)
		root.returnExports = factory(root.manip, expect);
	}
}(this, function (manip, expect) {
	
"use strict";

describe('manip',function() {
	
	it('can call $set', function() {
		var ob = {hi: 'there'};
		var one = manip(ob, {"$set": {'a.b.c': 99}});
		expect(one).to.eql({
			'hi': 'there',
			'a': {
				'b': {
					'c': 99
				}
			}
		});
	});
	
	it('can call $inc', function() {
		var ob = {hi: 'there', x: { y: 4}};
		expect(manip(ob, {"$inc": {"x.y": 1}})).to.eql({hi: 'there', x: { y: 5}});
	});
	
	it('can push (basic)', function() {
		var ob = {a:"234"};
		ob = manip(ob, {$set: {"d.e":[1,2,3]}});
		ob = manip(ob, {"$push": {"d.e": 4}});
		expect(ob).to.eql({
			"a" : "234",
			"d" : {
				"e" : [1, 2, 3, 4]
			}
		});
	});
	
	it('can push (creating)', function() {
		var ob = {a:"234"};
		ob = manip(ob, {"$push": {"d.e": 4}});
		expect(ob).to.eql({
			"a" : "234",
			"d" : {
				"e" : [4]
			}
		});
	});
	
	it('can push complex (creating)', function() {
		var ob = {a:"234"};
		ob = manip(ob, {"$push": {"d.e": {a: 1, b: 2, c: 3}}});
		expect(ob).to.eql({
			"a" : "234",
			"d" : {
				"e" : [{a: 1, b: 2, c: 3}]
			}
		});
	});
	
	it('can push with $each', function() {
		var ob = {a:"234"};
		ob = manip(ob, {$set: {"d.e":[1, 2, 3], "f": [4, 5, 6]}});
		ob = manip(ob, {"$push": {"d.e": 4, 'f': {'$each': [7, 8, 9]}}});
		expect(ob).to.eql({
			"a" : "234",
			"d" : {
				"e" : [1, 2, 3, 4]
			},
			"f": [4, 5, 6, 7, 8, 9]
		});
	});
	
	it('can push with $each and $sort (note only mostly like MongoDB)', function() {
		var ob = {a:"234", f: [
			{name: 'ben', 'score': 2},
			{name: 'bill', 'score': 4}
		]};
		ob = manip(ob, {$push: {
			"f": {
				$each: [
					{name: 'jack', 'score': 6},
					{name: 'jill', 'score': 3},
					{name: 'jon', 'score': 9},
					{name: 'jackie', 'score': 1}
				],
				$sort: {'score': 1}
			}
		}});
		expect(ob).to.eql({
			"a" : "234",
			"f": [
				{name: 'jackie', 'score': 1},
				{name: 'ben', 'score': 2},
				{name: 'jill', 'score': 3},
				{name: 'bill', 'score': 4},
				{name: 'jack', 'score': 6},
				{name: 'jon', 'score': 9}
			]
		});
		ob = manip(ob, {$push: {
			"f": {
				$each: [
					{name: 'alex', 'score': 1},
					{name: 'micheal', 'score': 1},
					{name: 'xavier', 'score': 5}
				],
				$sort: {'score': -1, 'name': 1},
			}
		}});
		expect(ob).to.eql({
			"a" : "234",
			"f": [
				{name: 'jon', 'score': 9},
				{name: 'jack', 'score': 6},
				{name: 'xavier', 'score': 5},
				{name: 'bill', 'score': 4},
				{name: 'jill', 'score': 3},
				{name: 'ben', 'score': 2},
				{name: 'alex', 'score': 1},
				{name: 'jackie', 'score': 1},
				{name: 'micheal', 'score': 1}
			]
		});
	});
	
	it('can push with $each and $sort with "." (note MongoDB cannot do this)', function() {
		
		var ob = {a:"234", f: ['bill', 'ben']};
		ob = manip(ob, {$push: {
			"f": {
				$each: [
					'jack',
					'jill',
					'jon',
					'jackie'
				],
				$sort: '.'
			}
		}});
		expect(ob).to.eql({
			"a" : "234",
			"f": ['ben', 'bill', 'jack', 'jackie', 'jill', 'jon']
		});
	});

	it('can push with $each, $sort and $slice (note only mostly like MongoDB)', function() {
		var ob = {a:"234", f: [
			{name: 'ben', 'score': 2},
			{name: 'bill', 'score': 4}
		]};
		ob = manip(ob, {$push: {
			"f": {
				$each: [
					{name: 'jack', 'score': 6},
					{name: 'jill', 'score': 3},
					{name: 'jon', 'score': 9},
					{name: 'jackie', 'score': 1}
				],
				$sort: {'score': 1},
				$slice: -3
			}
		}});
		expect(ob).to.eql({
			"a" : "234",
			"f": [
				{name: 'bill', 'score': 4},
				{name: 'jack', 'score': 6},
				{name: 'jon', 'score': 9}
			]
		});
	});

	
	it('can call $unset', function() {
		var ob = {hi: 'there'};
		var one = manip(ob, {"$set": {'a.b.c': 99}});
		var two = manip(one, {"$set": {'a.b.d': 88}});
		var three = manip(two, {"$unset": {'a.b.c': ''}});
		expect(three).to.eql({
			'hi': 'there',
			'a': {
				'b': {
					'd': 88
				}
			}
		});
	});
	
	it('can do many manipulations',function() {
		
		var i = 0;
		var ob = {hi:'there'};
		var steps = [
			{
				cmd: {'$set': {'car.color': 'red'}},
				expected:{hi: 'there', car: {color: 'red'}}
			},
			{
				cmd: {'$unset': {'car': 1}},
				expected:{hi: 'there'}
			},
			{
				cmd: {'$set': {'car.wheels': 3}},
				expected:{hi: 'there', car:{wheels:3}}
			},
			{
				cmd: {'$inc': {'car.wheels': 1}, '$set': {z: 1}},
				expected: {hi: 'there', car: {wheels:4},z: 1}
			},
			{
				cmd: {'$push': {'car.drivers': 'ann'}},
				expected: {hi: 'there', car: {wheels: 4, drivers: ['ann']}, z: 1}
			},
			{
				cmd: {'$push': {
					'car.drivers': {
						$each: ['fred', 'faye'],
						$sort: '.',
						$slice: -2
					}
				}},
				expected: {hi: 'there', car: {wheels: 4, drivers: ['faye', 'fred']}, z: 1}
			}
		];
		for (i=0; i<steps.length; i++) {
			ob = manip(ob, steps[i].cmd);
			expect(ob).to.eql(steps[i].expected);
		}

	});
	
});

}));