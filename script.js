document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const input = document.getElementById('inputer');
  
    const compostableItems = [
      'vegetable scraps',
      'friut peels',
      'friut scraps',
      'vegetable peels',
      'vegetable scraps',
      'fruits',
      'eggshells',
      'coffee grounds',
      'tea bags',
      'paper',
      'leaves',
      'grass',
      'branches',
      'sawdust',
      'napkins',
      'hay',
      'sticks'
    ];
  
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      const item = input.value.toLowerCase().trim();
  
      if (item === '') {
        alert('Please enter an item.');
        return;
      }
  
      let message;
      if (compostableItems.includes(item)) {
        message = 'can be composted!';
      } else {
        message = 'cannot be composted.';
      }
  
      window.location.href = `result.html?item=${encodeURIComponent(item)}&message=${encodeURIComponent(message)}`;
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const item = urlParams.get('item');
    const message = urlParams.get('message');
    document.getElementById('resultMessage').textContent = `${item} ${message}`;
});

function goBack() {
    window.history.back();
}

