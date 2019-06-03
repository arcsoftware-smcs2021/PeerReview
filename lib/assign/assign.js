// Sample list of papers, used for testing:
// var papers = ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4', 'Paper 5', 'Paper 6', 'Paper 7', 'Paper 8', 'Paper 9', 'Paper 10']


// Shuffle function to randomize array, to ensure assignments are not always the same
function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

// Function assign, takes in list of submissions and number of others they should be assigned to and assigns them to an object
function assign(papers_list, numb_of_assignments) {

  const len = papers_list.length;
  const dict = new Object();

  shuffle(papers_list);

  for (var i = 0; i < len; i++) {
    const list = [];

    const submission = papers[i];
    var num = numb_of_assignments + 1;

    for (var j = (i + 1) % len; j < (i + num) % len; j++) {
      list.push(papers_list[j]);
    }

    if (list.length == numb_of_assignments) {
      dict[submission] = list;
    } else {

      list = [];
    }
  }

  return (dict);
}


//assign(papers,3); // sample call based on papers list, used for testing
module.exports.assign = assign; // export the module
