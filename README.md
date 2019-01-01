# Meme (Data Desk remix)

Meme is a generator that Vox Media uses to create social sharing images. See working version at [http://www.sbnation.com/a/meme](http://www.sbnation.com/a/meme).

This is the Los Angeles Times Data Desk's fork. Here is what we added:

- Options to change the image's aspect ratio
- Options to set a solid background color
- Los Angeles Times fonts
- Los Angeles Times watermarks
- Linebreaks allowed in the headlines
- Deployment script to build static site inside newsroom VPN

![screenshot](readme.png)

How to deploy (at the LA Times)
-------------------------------

**Edit the ``source`` directory to make the changes you want**

You can fire up the test server locally by running:

```bash
$ make serve
```

**Build the source files into a working static site**

Like so:

```bash
$ make build
```

**Commit your work**

Use Git to commit your work to our repository.

```bash
# Add the changes
$ git add .
# Log your work
$ git commit -m "A precise message goes here"
# Push it up to GitHub
$ git push origin master
```

**Deploy your changes to Amazon S3**

```bash
$ make ship
```
