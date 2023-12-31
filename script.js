const showSideBar = () => {
  const sidebar = document.querySelector('#sidebar');
  const navbar = document.querySelector('#navbar');
  
  sidebar.classList.add('active');
  navbar.style.display = 'none';
};

const closeSideBar = () => {
  const sidebar = document.querySelector('#sidebar');
  const navbar = document.querySelector('#navbar');
  
  sidebar.classList.remove('active');
  navbar.style.display = 'flex';
};