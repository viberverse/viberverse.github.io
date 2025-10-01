// On settings change
document.body.classList.toggle('matrix-on', true);
localStorage.setItem('matrixEnabled', 'true');

// On page load
if (localStorage.getItem('matrixEnabled') === 'true') {
  document.body.classList.add('matrix-on');
  startMatrix(document.getElementById('matrixCanvas'));
}

