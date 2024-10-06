const root = document.getElementById('walletConnectBlock');

if (root != null) {
  import('./main').then((module) => {
    module.main(root);
  });
}

export {};
