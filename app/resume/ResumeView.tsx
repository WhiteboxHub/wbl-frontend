import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { faArrowDown, faFileCode, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ResumePreviewProps {
  renderedHtml: string;
  getJson: () => void;
  resumeJson: object;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ renderedHtml, getJson, resumeJson }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false); // Spinner state
  const [errorMessage, setErrorMessage] = useState<string>('');

  // useEffect(() => {
  //   if (iframeRef.current) {
  //     const iframe = iframeRef.current;
  //     const doc = iframe.contentDocument || iframe.contentWindow?.document;

  //     if (doc) {
  //       doc.open();
  //       doc.write(renderedHtml);
  //       doc.close();

  //       // Inject external stylesheet into the iframe's document
  //       const styleLink = doc.createElement('link');
  //       styleLink.rel = 'stylesheet';
  //       styleLink.href = '/templates/style.css';
  //       doc.head.appendChild(styleLink);

  //       // Optionally inject custom CSS for scrollbars and content fitting
  //       const style = doc.createElement('style');
  //       style.innerHTML = `
  //       /* Enable scrolling for both axes */
  //       body {
  //         overflow: auto;
  //         scroll-behavior: smooth;
  //         margin: 0;
  //         padding: 0;
  //       }

  //       /* Responsive layout to prevent unnecessary scroll */
  //       .container {
  //         width: 100%;
  //         box-sizing: border-box;
  //       }

  //       /* Scrollbar styling */
  //       ::-webkit-scrollbar {
  //         width: 8px;
  //         height: 8px;
  //       }

  //       ::-webkit-scrollbar-track {
  //         background: #ffffff;
  //       }

  //       ::-webkit-scrollbar-thumb {
  //         background: #f0f0f0;
  //         border-radius: 10px;
  //         border: 1px solid #dcdcdc;
  //       }

  //       ::-webkit-scrollbar-thumb:hover {
  //         background: #e0e0e0;
  //       }
  //     `;
  //       doc.head.appendChild(style);
  //     }
  //   }
  // }, [renderedHtml]);
  
  
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(renderedHtml);
        doc.close();

        // Inject external stylesheet into the iframe's document
        const styleLink = doc.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/templates/style.css';
        doc.head.appendChild(styleLink);

        // Inject custom CSS for content fitting and completely hiding scrollbars
        const style = doc.createElement('style');
        style.innerHTML = `
        /* Global scrollbar hiding */
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        /* Body specific styles */
        body {
          overflow: auto;
          scroll-behavior: smooth;
          margin: 0;
          padding: 0;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        body::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        /* Container styles */
        .container {
          width: 100%;
          box-sizing: border-box;
          overflow: auto;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .container::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        /* Hide scrollbars for all elements */
        div, section, article, aside, nav, header, footer {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        div::-webkit-scrollbar,
        section::-webkit-scrollbar,
        article::-webkit-scrollbar,
        aside::-webkit-scrollbar,
        nav::-webkit-scrollbar,
        header::-webkit-scrollbar,
        footer::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
        doc.head.appendChild(style);
      }
    }
  }, [renderedHtml]);
  
  
  
  const handleDownloadPdf = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.RESUME_PUBLIC_API_URL;
      const modifiedRenderedHtml = renderedHtml.replace(
        /<\/head>/i,
        `<style>
         /* Utils */
      /*----- Colors -----*/
      /*----- Fonts -----*/
      /*----- Dimensions and sizes -----*/
      /* Base */
      @font-face {
          font-family: 'Josefin Sans';
          font-style: normal;
          font-weight: 300;
          src: local('Josefin Sans Light'), local('JosefinSans-Light'), url(https://fonts.gstatic.com/s/josefinsans/v14/Qw3FZQNVED7rKGKxtqIqX5Ecpl5te10k.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Josefin Sans';
          font-style: normal;
          font-weight: 700;
          src: local('Josefin Sans Bold'), local('JosefinSans-Bold'), url(https://fonts.gstatic.com/s/josefinsans/v14/Qw3FZQNVED7rKGKxtqIqX5Ectllte10k.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: italic;
          font-weight: 300;
          src: local('Lato Light Italic'), local('Lato-LightItalic'), url(https://fonts.gstatic.com/s/lato/v16/S6u_w4BMUTPHjxsI9w2_Gwfo.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: italic;
          font-weight: 400;
          src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v16/S6u8w4BMUTPHjxsAXC-v.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: italic;
          font-weight: 700;
          src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v16/S6u_w4BMUTPHjxsI5wq_Gwfo.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-weight: 300;
          src: local('Lato Light'), local('Lato-Light'), url(https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh7USSwiPHA.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-weight: 400;
          src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wWw.ttf) format('truetype');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-weight: 700;
          src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v16/S6u9w4BMUTPHh6UVSwiPHA.ttf) format('truetype');
        }
        
        html {
          background: white;
        }
        
        body {
          font-family: "Lato", Helvetica, Arial, sans-serif;
          font-weight: 400;
          background: white;
          margin: 50px 0 100px;
          letter-spacing: .3px;
          color: #39424B;
        }
        
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          text-transform: none;
          margin: 0;
        }
        
        h1 {
          font-family: "Josefin Sans", Helvetica, Arial, sans-serif;
          font-weight: 700;
          font-size: 40px;
          letter-spacing: 1px;
        }
        
        h2 {
          font-family: "Josefin Sans", Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 16px;
          letter-spacing: .5px;
        }
        
        h3 {
          font-family: "Lato", Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 14px;
          letter-spacing: .4px;
        }
        
        h3.bold {
          font-weight: 700;
        }
        
        h4 {
          font-family: "Lato", Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 12px;
        }
        
        h4.bold {
          font-weight: 700;
        }
        
        h5 {
          font-family: "Lato", Helvetica, Arial, sans-serif;
          font-weight: 300;
          font-size: 11px;
        }
        
        h5.italic {
          font-style: italic;
        }
        
        h6 {
          font-family: "Lato", Helvetica, Arial, sans-serif;
          font-weight: 400;
          font-size: 10px;
        }
        
        a {
          color: inherit;
          text-decoration: inherit;
        }
        
        a:hover {
          color: #2895F1;
        }
        
        a .fa-external-link {
          font-size: 10px;
          vertical-align: text-top;
        }
        
        p,
        li {
          font-size: 11px;
        }
        
        blockquote {
          font-size: 11px;
          font-family: "Lato", Helvetica, Arial, sans-serif;
          font-weight: 400;
          font-style: italic;
          margin: 10px 25px;
        }
        
        em {
          color: #999;
        }
        
        ul {
          margin: 10px 0 0;
          -webkit-padding-start: 25px;
        }
        
        ul li {
          padding-left: 10px;
        }
        
        ul.minimal {
          list-style: none;
          padding: 0;
        }
        
        ul.minimal li {
          margin-bottom: 3px;
          padding-left: 0;
        }
        
        ul.two-column {
          -webkit-column-count: 2;
          -webkit-column-gap: 28px;
          column-count: 2;
          column-gap: 28px;
        }
        
        ul.two-column li {
          padding-left: 0;
        }
        
        @page {
          size: A4;
        }
        
        .container {
          padding-top: 20px;
        }
        
        .keyline {
          width: 45px;
          margin: 8px 0 10px;
          border-top: 1px solid #56817A;
        }
        
        .pull-left {
          float: left;
        }
        
        .pull-right {
          float: right;
        }
        
        .clearfix:after {
          content: "";
          display: table;
          clear: both;
        }
        
        .profile-pic {
          margin-top: -5px;
          margin-right: 18px;
        }
        
        .profile-pic img {
          height: 52px;
          width: 52px;
          border-radius: 50%;
          border: 2px solid #56817A;
        }
        
        .summary {
          margin: 5px 0 5px;
        }
        
        .sublink {
          font-size: 70%;
          font-weight: 200;
          color: dimgray;
        }
        
        .capitalize {
          text-transform: capitalize;
        }
        
        /* Layouts */
        .page {
          background: white;
          color: black;
          width: 100%;
          min-height: 570px;
          display: block;
          margin: 0 auto;
          border-top: 10px solid #56817A;
          padding: 36px 22px 30px 34px;
          box-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
        }
        
        .page:after {
          content: "";
          display: table;
          clear: both;
        }
        
        .left-column {
          float: left;
          width: 160px;
          margin-right: 20px;
          word-wrap: break-word;
        }
        
        .right-column {
          width: auto;
          overflow: hidden;
        }
        
        .item {
          margin-bottom: 15px;
        }
        
        .item:last-child {
          margin-bottom: 0;
        }
        
        @media print {
          body {
            margin: 0;
          }
        
          .page {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 36px 0 30px;
            box-shadow: none;
          }
        
          .page .resume-header,
          .page .resume-content {
            padding: 0 22px 0 34px;
          }
        
          .container {
            page-break-inside: avoid;
          }
        
          .work-container .item {
            page-break-inside: avoid;
          }
        
          .fa-external-link {
            display: none;
          }
        }
        
        /* Components */
        .info-tag-container {
          margin-bottom: 5px;
        }
        
        .info-tag-container .fa {
          font-size: 14px;
          width: 12px;
          margin-right: 5px;
          text-align: center;
          vertical-align: middle;
        }
        
        .info-tag-container .fa.fa-map-marker {
          font-size: 16px;
        }
        
        .info-tag-container .fa.fa-mobile {
          font-size: 18px;
        }
        
        .info-tag-container .fa.fa-envelope-o {
          font-size: 12px;
        }
        
        .info-tag-container .fa.fa-desktop {
          font-size: 11px;
        }
        
        .info-tag-container .fa.fa-external-link {
          width: auto;
          font-size: inherit;
          vertical-align: text-top;
        }
        
        .info-tag-container .info-text {
          font-size: 12px;
          text-transform: none;
          display: inline-block;
          vertical-align: middle;
          width: 139px;
        }
        
        .references-container .fa {
          font-size: 14px;
        }
        
        .education-container .location {
          padding-bottom: 6px;
          font-weight: 400;
        }
        
        .education-container .specialization {
          text-transform: none;
          font-style: italic;
        }
        
        .flex-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
        
        .main-skill {
          font-size: 80%;
        }
        
        .skill {
          margin: .15em;
          padding: .15em;
          background: ghostwhite;
          border-radius: 5px;
        }
        
              </style>`
            );
            // console.log(modifiedRenderedHtml)
            //console.log(JSON.stringify(resumeJson))
      
            const response = await axios.post(`${apiUrl}/download-pdf`, {
              html: modifiedRenderedHtml,
              resumeJson: JSON.stringify(resumeJson),
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              responseType: 'blob'
            });
      

      // Extract the filename from the Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      // console.log(contentDisposition);
      let filename = 'resume.pdf'; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1]; // Use the filename from the response header
        }
      }
      // Create a URL for the PDF blob and initiate download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up after download
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // If status is 401, show the specific message to the user
        setErrorMessage(`You can't download, Please register with a new email to continue` );
      } else {
        // console.error('Error downloading PDF:', error);
        setErrorMessage('An error occurred while downloading the PDF');
      }
    }
    finally {
      setIsLoading(false); // Hide spinner after download completes
    }
  };
// ... existing code ...

// return (
//   <div className="flex flex-col h-full">
//     {/* Error Message */}
//     {errorMessage && (
//       <div className="mb-4">
//         <div className="p-4 rounded-md bg-red-50 border border-red-200">
//           <p className="text-red-700 text-sm">{errorMessage}</p>
//         </div>
//       </div>
//     )}

//     {/* Main Content */}
//     <div className="lg:col-span-2 flex-grow">
//       <div className="flex h-full flex-col rounded-lg border border-gray-300 bg-white shadow-md dark:border-gray-600 dark:bg-gray-700">
//         {/* Header with Download Buttons */}
//         <div className="p-4 border-b border-gray-200 dark:border-gray-600">
//           <div className="flex justify-between items-center">
//             {/* JSON Download Button */}
//             <button
//               className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
//               onClick={getJson}
//               title="Download JSON"
//             >
//               <svg 
//                 xmlns="http://www.w3.org/2000/svg" 
//                 className="w-8 h-8 text-gray-700 dark:text-gray-300"
//                 viewBox="0 0 16 16"
//               >
//                 <path fill="currentColor" fillRule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM4.151 15.29a1.2 1.2 0 0 1-.111-.449h.764a.58.58 0 0 0 .255.384q.105.073.25.114q.142.041.319.041q.245 0 .413-.07a.56.56 0 0 0 .255-.193a.5.5 0 0 0 .084-.29a.39.39 0 0 0-.152-.326q-.152-.12-.463-.193l-.618-.143a1.7 1.7 0 0 1-.539-.214a1 1 0 0 1-.352-.367a1.1 1.1 0 0 1-.123-.524q0-.366.19-.639q.192-.272.528-.422q.337-.15.777-.149q.456 0 .779.152q.326.153.5.41q.18.255.2.566h-.75a.56.56 0 0 0-.12-.258a.6.6 0 0 0-.246-.181a.9.9 0 0 0-.37-.068q-.324 0-.512.152a.47.47 0 0 0-.185.384q0 .18.144.3a1 1 0 0 0 .404.175l.621.143q.326.075.566.211a1 1 0 0 1 .375.358q.135.222.135.56q0 .37-.188.656a1.2 1.2 0 0 1-.539.439q-.351.158-.858.158q-.381 0-.665-.09a1.4 1.4 0 0 1-.478-.252a1.1 1.1 0 0 1-.29-.375z"/>
//               </svg>
//             </button>

//             {/* PDF Download Button */}
//             <button
//               className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
//               onClick={handleDownloadPdf}
//               title="Download PDF"
//             >
//               <svg 
//                 xmlns="http://www.w3.org/2000/svg" 
//                 className="w-8 h-8 text-gray-700 dark:text-gray-300"
//                 viewBox="0 0 16 16"
//               >
//                 <path fill="currentColor" fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v3.999h.791v-1.342h.803q.43 0 .732-.173q.305-.175.463-.474a1.4 1.4 0 0 0 .161-.677q0-.375-.158-.677a1.2 1.2 0 0 0-.46-.477q-.3-.18-.732-.179z"/>
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Loading Bar */}
//         {isLoading && (
//           <div className="px-4 py-2">
//             <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
//               <div className="h-full w-full relative">
//                 <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 animate-loading-bar"></div>
//                 <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-white to-transparent opacity-30 animate-shimmer"></div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Resume Preview */}
//         <div className="flex-grow p-4">
//           <iframe
//             ref={iframeRef}
//             className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-md"
//             title="Resume Preview"
//           />
//         </div>
//       </div>
//     </div>

//     {/* Animation Styles */}
//     <style jsx>{`
//       @keyframes loading-bar {
//         0% { left: -33.33%; }
//         100% { left: 100%; }
//       }
//       @keyframes shimmer {
//         0% { transform: translateX(-100%); }
//         100% { transform: translateX(100%); }
//       }
//       .animate-loading-bar {
//         animation: loading-bar 2s ease-in-out infinite;
//       }
//       .animate-shimmer {
//         animation: shimmer 1.5s linear infinite;
//       }
//     `}</style>
//   </div>
// );

return (
  <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
    {/* Error Message */}
    {errorMessage && (
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-md p-4">
          <div className="rounded-md bg-red-50 p-4 shadow-lg">
            <p className="text-center text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      </div>
    )}

    {/* Main Content */}
    <div className="flex flex-col flex-grow rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Header with Download Buttons */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
   
      {/* Header with Download Buttons */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          {/* JSON Download Button */}
          <button
            onClick={getJson}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Download JSON"
          >
            {/* <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 17V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-1">JSON</span> */}
             <FontAwesomeIcon icon={faFileCode} className="h-4 w-4" />
          </button>

          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Download PDF"
          >
            {/* <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 17V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-1">PDF</span> */}
             <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4" />
          </button>
        </div>
      </div>

      </div>

      {/* Loading Bar */}
      {/* {isLoading && (
        <div className="absolute inset-x-7 top-0">
          <div className="h-1 overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div className="animate-loading-progress h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          </div>
        </div>
      )} */}
      {isLoading && (
  <div className="absolute top-0 left-10 right-0"> {/* Adjust 'left-10' to control the starting position */}
    <div className="h-1 overflow-hidden bg-gray-200 dark:bg-gray-700 m-0 p-0">
      <div className="animate-loading-progress h-full w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 m-0 p-0"></div>
    </div>
  </div>
)}

      {/* Resume Preview */}
      <div className="relative flex-grow p-4">
        <iframe
          ref={iframeRef}
          className="h-full w-full rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          title="Resume Preview"
        />
      </div>
    </div>

    {/* Animation Styles */}
    <style jsx>{`
  @keyframes loading-progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-loading-progress {
    animation: loading-progress 1s ease-in-out infinite;
    margin: 0;
    padding: 0;
  }
`}</style>
    {/* Global styles to hide scrollbars */}
    <style jsx global>{`
      iframe {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      iframe::-webkit-scrollbar {
        display: none;
      }
    `}</style>
  </div>
);

};

export default ResumePreview;

