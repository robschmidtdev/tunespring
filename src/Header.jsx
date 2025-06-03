import React from 'react';

const Header = () => {
  const navbarStyle = {
    // backgroundColor: '#222', // dark background
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
  };

  const logoStyle = {
    height: '40px', // smaller logo height
  };

  return (
    <nav style={navbarStyle}>
      <a href="./index.php" style={{ display: 'inline-block' }}>
        <img
          src="./Logo_TuneSpring_weiß_zugeschnitten.png"
          alt="Logo"
          style={logoStyle}
        />
      </a>
    </nav>
  );
};

export default Header;

