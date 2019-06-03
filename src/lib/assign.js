function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function assign(papers,numb_of_assignments) {
  var len = papers.length;
  var dict = {};

  shuffle(papers);

  for (var i = 0; i < len; i++) {
    var list = [];

    var submission = papers[i];
    var num = numb_of_assignments + 1;

    for (var j = (i + 1) % len; j < (i + num) % len; j++) {
      list.push(papers[j]);
    }

    if (list.length === numb_of_assignments) {
      dict[submission] = list;
    } else {

      list = [];
    }
  }

  return dict;
}


//assign(papers,3); // sample call
module.exports = assign;
