# Compare the sizes of places

Select any administrative places in Open Street Map and compare their sizes.

This was borne out of my desire to have a more tangible grasp on the sizes of places that I was not familiar with , or even of places that I was familiar with but had no real sense of scale for. This tool allows me to compare the size of one place in relation to another place that I do have a tangible sense of scale for.

![Sample screencast of the tool in use, comparing Philadelphia to the Gaza Strip](docs/demo.gif)

The tool uses Open Street Map data hosted in Bigquery, and an orthographic projection via D3 to visualize the places on a globe. It positions each place as if you were looking directly down on it from space, in order to minimize distortion.

Other tools that do similar things include:
- [The True Size Of](https://thetruesize.com/) - allows you to drag and drop countries on a map to compare their sizes
- [True Size Of Countries](https://truesizeofcountries.org/) - similar to _The True Size Of_
