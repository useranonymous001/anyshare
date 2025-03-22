const { PDFDocument } = require("pdf-lib");
const AppError = require("../utils/errorApi");
const { Readable } = require("node:stream");

async function fetchImageBuffers(bucket, userId) {
  const images = await bucket.find({ "metadata.userId": userId }).toArray();

  const imageBuffer = [];

  try {
    await Promise.all(
      images.map((image) => {
        return new Promise((resolve, reject) => {
          let chunks = [];

          const downloadStream = bucket.openDownloadStream(image._id);

          downloadStream.on("data", (chunk) => {
            chunks.push(chunk);
          });

          downloadStream.on("end", async () => {
            imageBuffer.push(Buffer.concat(chunks));
            resolve();
          });

          downloadStream.on("error", (err) => {
            reject(err);
          });
        });
      })
    );
  } catch (error) {
    throw new AppError("UnhandledAppError", 500, error, true);
  }

  return imageBuffer;
}

async function imageToPdf(imageBuffer) {
  try {
    const pdfDoc = await PDFDocument.create();

    for (const imgBuff of imageBuffer) {
      const image = await pdfDoc.embedPng(imgBuff);

      const { width, height } = image.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 10,
        width,
        height,
      });
    }
    const pdfBytes = await pdfDoc.save();

    // save locally to your computer in a file
    //   fs.writeFileSync(outputFilePath, pdfBytes);

    return pdfBytes;
  } catch (error) {
    throw new AppError(
      "InvalidImageType",
      500,
      `Only PNG images are accepted: ${error.message}`,
      true
    );
  }
}

async function fetchPDFBuffers(bucket) {
  const uploadedPDF = await bucket.find().toArray();

  if (uploadedPDF.length < 1) {
    throw new AppError("No File is Uploaded", 500);
  }
  let pdfBuffers = [];
  try {
    await Promise.all(
      uploadedPDF.map((pdf) => {
        return new Promise((resolve, reject) => {
          let chunks = [];

          const downloadStream = bucket.openDownloadStream(pdf._id);

          downloadStream.on("data", (chunk) => {
            chunks.push(chunk);
          });

          downloadStream.on("end", () => {
            pdfBuffers.push(Buffer.concat(chunks));
            resolve();
          });

          downloadStream.on("error", (err) => {
            reject(err);
          });
        });
      })
    );
  } catch (error) {
    throw new AppError(
      "InternalServerError",
      500,
      "could not fetch data from store",
      true
    );
  }

  return pdfBuffers;
}

async function mergePDF(pdfArrayBuffers) {
  try {
    const mergePdfDoc = await PDFDocument.create();

    for (const pdfBytes of pdfArrayBuffers) {
      const pdf = await PDFDocument.load(pdfBytes);

      const copiedPages = await mergePdfDoc.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      copiedPages.forEach((page) => mergePdfDoc.addPage(page));
    }
    return await mergePdfDoc.save();
  } catch (error) {
    throw new AppError(
      "InternalServerError",
      500,
      "something went wrong",
      true
    );
  }
}

module.exports = {
  fetchImageBuffers,
  imageToPdf,
  fetchPDFBuffers,
  mergePDF,
};
