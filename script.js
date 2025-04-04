const dataFile = fetch('tiles.json')
const manifestFile = fetch('manifest.json');

Promise.all([dataFile, manifestFile])
  .then(responses => Promise.all(responses.map(response => response.json())))
  .then(data => {
    var tiles = data[0];
    var manifest = data[1];
    buildPage(tiles, manifest);
  })
  .catch(error => console.log(error));

var currentLocation = 'screensaver';
var openedNewWindow = false;

function toggleTiles(categoryNameOpen) {
  if (categoryNameOpen === 'start') {
    toggleStart();
  } else {
    toggleCategory(categoryNameOpen);
  }
}

function toggleStart() {
  var backgroundImg = document.getElementById('background-img');
  var screensaverTitle = document.getElementById('screensaver-title');
  var homeContainer = document.getElementById('home');
  console.log('Opening Category: home');
  backgroundImg.classList.toggle('fade-out');
  screensaverTitle.style.display = 'none';
  homeContainer.classList.toggle('show-tiles');
  currentLocation = 'home';
}

function toggleCategory(categoryNameOpen) {
  var els;
  els = document.getElementsByClassName('tiles-container');
  Array.prototype.forEach.call(els, function(el) {
    el.classList.remove('show-tiles');
  });
  console.log('Opening Category: ' + categoryNameOpen);
  const newContainer = document.getElementById(categoryNameOpen);
  newContainer.classList.toggle('show-tiles');
  currentLocation = categoryNameOpen;
}

function openNewWindow(url) {
  openedNewWindow = true;
  window.open(url, '_blank');
}

function buildPage(tiles, manifest) {
  console.log('building page...');

  var mainContainer = document.getElementById('main');

  console.log(tiles.mainTiles);
  createTiles(tiles.mainTiles, mainContainer, 'home');

  var start = document.getElementById('click-to-start');
  start.addEventListener('click', toggleStart);
  var ssTitle = document.getElementById('screensaver-title');
  ssTitle.innerHTML = 'Tap on the screen to view';

  const apiManifestURL = 'https://api.github.com/repos/cjeccles/TheBridge/contents/manifest.json';
  const apiTilesURL = 'https://api.github.com/repos/cjeccles/TheBridge/contents/tiles.json';

  fetch(apiManifestURL)
    .then(response => response.json())
    .then(gitData => {
      const decodedContent = atob(gitData.content);

      const gitManifest = JSON.parse(decodedContent);

      var versionEl = document.createElement('div');
      versionEl.setAttribute('id', 'version');
      if (manifest.app_version < gitManifest.app_version) {
        versionEl.innerHTML = 'Version: ' + manifest.app_version + ' (Update Available)';
        versionEl.classList.add('version-bad');
      } else {
        versionEl.innerHTML = 'Version: ' + manifest.app_version;
        versionEl.classList.add('version-good');
      }
      mainContainer.appendChild(versionEl);
      console.log('App Version: ' + manifest.app_version);
    })
    .then(() => {
      fetch(apiTilesURL)
        .then(response => response.json())
        .then(gitData => {
          const decodedContent = atob(gitData.content);

          const gitTiles = JSON.parse(decodedContent);

          var versionEl = document.getElementById('version');
          var versionElInner = document.createElement('span');
          versionElInner.innerHTML = '[' + tiles.tilesVersion + ']';
          if (tiles.tilesVersion < gitTiles.tilesVersion) {
            versionElInner.classList.add('version-bad');
          } else {
            versionElInner.classList.add('version-good');
          }
          versionEl.appendChild(versionElInner);
          console.log('Tiles Version: ' + tiles.tilesVersion);
        })
    });
}

function createTiles(tiles, parentContainer, newCategoryName, prevLocation = 'home') {
  if (newCategoryName) {
    console.log(`creating new tiles-container for ${tiles.length} tiles...`);
    var newContainer = document.getElementById(newCategoryName) || document.createElement('div');
    newContainer.setAttribute('id', newCategoryName);
    newContainer.classList.add('tiles-container');
    console.log(`appending '${newContainer.id}' => '${parentContainer.id}'`);
    parentContainer.appendChild(newContainer);
  }

  if (newCategoryName != 'home') {
    var navElm = document.createElement('div');
    navElm.classList.add('navigate-back');
    navElm.innerHTML = `<i class="arrow left"></i>`;
    navElm.addEventListener('click', toggleTiles.bind(this, prevLocation), false);
    newContainer.appendChild(navElm);
  }

  console.log('creating tiles...');
  for (let i = 0; i < tiles.length; i++) {
    var tile = tiles[i];

    console.log(`creating tile for ${tile.title}:\n
                  img = ${tile?.img}\n
                  isBae = ${tile?.isBae}\n
                  url = ${tile?.url}\n
                  items = ${tile?.items}`);
    var newTile = document.createElement('div');
    newTile.classList.add('tile');
    newTile.classList.add('transition');

    if (tile?.img) {
      var preloadImage = new Image();
      preloadImage.src = `images/${tile.img}`
      newTile.classList.add('bg-image');
      newTile.style.backgroundImage = `url(images/${tile.img})`;
    } else {
      newTile.innerHTML = tile.title;
    }

    if (tile?.forceTitle) {
      var newEl = document.createElement('div');
      newEl.classList.add('tile-title');
      newEl.innerHTML = tile.title;
      newTile.appendChild(newEl);
    }

    if (tile?.isBae) {
      newTile.classList.add('baeorange');
    }

    if (tile?.bg_color) {
      newTile.style.backgroundColor = tile.bg_color;
    }

    if (tile?.addPadding) {
      newTile.style.padding = '2%';
      newTile.style.backgroundOrigin = 'content-box'
    }

    if (tile?.url) {
      newTile.addEventListener('click', openNewWindow.bind(this, tile.url, false))
    }

	if (tile?.darkText) {
      newTile.style.color = '#65645d'
	}
	
    if (tile?.items) {
      console.log('tile has child items, include event listener to open new container...');
      newTile.addEventListener('click', toggleTiles.bind(this, tile.categoryName), false);
      createTiles(tile.items, parentContainer, tile.categoryName, prevLocation);
    }

    console.log(`appending ${tile.title} => ${newContainer.id}`);
    newContainer.appendChild(newTile);
  }
}

function handleVisibilityChange() {
  const isVisible = document.visibilityState === 'visible';
  const currentTime = Math.round(Date.now() / 1000);
  const suspendedTime = parseInt(sessionStorage.getItem('timeSuspended'), 10) || 0;
  const timeDifference = currentTime - suspendedTime;

  if (isVisible && openedNewWindow) {
    console.log('Page to external site has been closed, resume current session');
    openedNewWindow = false;
  } else if (isVisible && !openedNewWindow && currentLocation !== 'screensaver' && timeDifference > 300) {
    console.log('App suspended for > 5 minutes, refreshing...');
    window.location.reload();
  } else if (!isVisible && openedNewWindow) {
    console.log('External page opened');
  } else if (!isVisible && !openedNewWindow) {
    sessionStorage.setItem('timeSuspended', currentTime);
    console.log('User navigated away from the app');
  } else {
    console.log('App resumed...');
  }
}



window.onload = function() {
  window.addEventListener('visibilitychange', handleVisibilityChange);
}