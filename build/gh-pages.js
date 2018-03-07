#!/usr/bin/env node
const ncp = require('ncp').ncp;
const fs = require('fs');
const exec = require('child_process').exec;
const rimraf = require('rimraf');
const path = require('path');
const args = require('args');
const mkdirp = require('mkdirp');

const index = 'index.html';
const base = 'docs';
let folder = '';

args
  .option('folder', 'the folder where you want to build');

const flags = args.parse(process.argv);

if (flags.folder) {
  folder = `${base}/${flags.folder}/`;
} else {
  folder = `${base}/`;
}
console.log(`I'll be running on folder ${folder}`);

function copy404() {
  ncp('404.html', `${folder}404.html`, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function copyCNAME() {
  ncp('CNAME', `${folder}CNAME`, (err) => {
    if (err) {
      console.error(err);
    }
  });
}


function editForProduction() {
  console.log('Preparing files for github pages');

  fs.readFile(folder + index, 'utf-8', (err, data) => {
    if (err) throw err;

    const newValue = data.replace(/src=\//g, 'src=');

    fs.writeFile(folder + index, newValue, 'utf-8', (err) => {
      if (err) throw err;
      fs.readFile(folder + index, 'utf-8', (err, data) => {
        if (err) throw err;
        const newValue2 = data.replace(/href=\//, 'href=');
        fs.writeFile(folder + index, newValue2, 'utf-8', (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log('upload it on github');
          }
        });
      });
    });
  });
}

function runBuild() {
  // Create development build
  console.log('Creating production build');

  exec('yarn run build', () => {
    // Move the dist folder to docs for gh-pages
    ncp.limit = 16;

    ncp('dist', folder, (err) => {
      if (err) {
        return console.error(err);
      }
      console.log('Build Complete.');
      pathToBuild = 'dist';

      exec(`rm -r ${pathToBuild}`, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
        } else {
          if (fs.existsSync('CNAME')) {
            copyCNAME();
          }
          if (fs.existsSync('404.html')) {
            copy404();
          }
          editForProduction();
        }
      });
    });
  }).stderr.pipe(process.stderr);
}


// Remove existing folder if it exists

if (fs.existsSync(folder)) {
  const pathToDocs = folder;
  rimraf(pathToDocs, () => {
    mkdirp(folder, (err) => {
      if (err) console.error(err);
      else runBuild();
    });
  });
} else {
  mkdirp(folder, (err) => {
    if (err) console.error(err);
    else runBuild();
  });
}
