import Layout from "@/components/Common/Layout";

export const metadata = {
  title: "Privacy Policy - Whitebox Learning",
  description:
    "Privacy Policy describing data collection, assessment processing, YouTube Data API Services integration, retention schedules, and user privacy rights at Whitebox Learning, Inc.",
};

export default function PrivacyPolicy() {
  return (
    <div className="container px-4 pb-16 sm:px-6">
      {/* Navigation */}
      <nav className="mt-20 flex h-auto flex-col items-start justify-center sm:mt-28 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-center text-2xl font-bold text-black dark:text-white sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
          Privacy Policy
        </h1>
        <div className="hidden sm:block">
          <Layout currentPage="Privacy Policy" />
        </div>
      </nav>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-12 shadow-sm dark:border-gray-800 dark:bg-dark">
        <div className="mb-6 flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <span>Effective Date: October 15, 2026</span>
          <span>Last Updated: October 15, 2026</span>
        </div>

        <p className="mb-6 leading-relaxed text-gray-800 dark:text-gray-300">
          Welcome to <strong>Whitebox Learning, Inc.</strong> We are committed to safeguarding the privacy, confidentiality, and integrity of personal data entrusted to us by our students, job candidates, instructors, enterprise training clients, and website visitors.
        </p>
        <p className="mb-6 leading-relaxed text-gray-800 dark:text-gray-300">
          This Privacy Policy governs our data handling practices across our platform website (
          <a href="https://whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">
            https://whitebox-learning.com
          </a>
          ), our interactive AI Prep assessment portal, our learning management interfaces, and associated services. This document outlines what information we collect, how it is processed and evaluated, how video recordings are managed and hosted through YouTube API Services, how data retention and deletion lifecycles are enforced, and your legal rights concerning your personal information.
        </p>

        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-gray-700 dark:text-blue-200">
          <strong>Mandatory Notice regarding YouTube API Services:</strong> Whitebox Learning utilizes <strong>YouTube API Services</strong> to deliver, host, and stream candidate practice sessions, mock interview evaluations, and educational recordings. By using features powered by YouTube API Services, you agree to be bound by the{" "}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-blue-600 dark:hover:text-blue-300"
          >
            YouTube Terms of Service
          </a>{" "}
          and acknowledge the{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-blue-600 dark:hover:text-blue-300"
          >
            Google Privacy Policy
          </a>
          .
        </div>

        <h3 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          Table of Contents
        </h3>
        <ol className="mb-10 list-inside list-decimal space-y-2 text-gray-800 dark:text-gray-300">
          <li>
            <a href="#section-1" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Organizational Scope, Data Roles &amp; Request Fulfillment
            </a>
          </li>
          <li>
            <a href="#section-2" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Categories of Information We Collect &amp; Data Minimization
            </a>
          </li>
          <li>
            <a href="#section-3" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Assessment Media, Pre-Assessment Consent &amp; Educational AI Evaluation
            </a>
          </li>
          <li>
            <a href="#section-4" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              YouTube API Services Integration, Upload Notices &amp; Data Deletion
            </a>
          </li>
          <li>
            <a href="#section-5" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Purposes &amp; Legal Bases for Processing
            </a>
          </li>
          <li>
            <a href="#section-6" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Subprocessors, AI Model Providers &amp; Infrastructure
            </a>
          </li>
          <li>
            <a href="#section-7" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Authoritative Data Retention &amp; Deletion Schedule
            </a>
          </li>
          <li>
            <a href="#section-8" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Your Privacy Rights &amp; Operational Fulfillment Workflows
            </a>
          </li>
          <li>
            <a href="#section-9" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Security Safeguards &amp; Credential Isolation Controls
            </a>
          </li>
          <li>
            <a href="#section-10" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Children&apos;s Privacy &amp; Prohibition of Child-Directed Content
            </a>
          </li>
          <li>
            <a href="#section-11" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Cross-Border Data Transfers &amp; Transfer Mechanisms
            </a>
          </li>
          <li>
            <a href="#section-12" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Policy Modifications &amp; Privacy Office Contacts
            </a>
          </li>
        </ol>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        {/* Section 1 */}
        <div id="section-1" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            1. Organizational Scope, Data Roles &amp; Request Fulfillment
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning, Inc. is a California corporation with its principal executive office located at:
          </p>
          <div className="mb-4 rounded-md bg-gray-50 p-4 font-mono text-sm dark:bg-gray-700 space-y-0.5">
            <div>Whitebox Learning, Inc.</div>
            <div>6500 Dublin Blvd., Ste. 218</div>
            <div>Dublin, CA 94568, United States</div>
            <div>Compliance &amp; Privacy Office: <a href="mailto:recruiting@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a></div>
            <div>General Support: <a href="mailto:info@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">info@whitebox-learning.com</a></div>
          </div>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Depending on how your access to Whitebox Learning is established, our legal role and data protection obligations are structured as follows:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-3 text-gray-800 dark:text-gray-300">
            <li>
              <strong>Direct Candidates &amp; Students (Data Controller):</strong> When you register independently on our platform or enroll directly as an individual candidate or student, Whitebox Learning acts as the Data Controller determining the purposes and means of processing your personal data. You may exercise your statutory privacy rights directly with us by contacting <a href="mailto:recruiting@whitebox-learning.com" className="font-semibold text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>.
            </li>
            <li>
              <strong>Enterprise &amp; Sponsored Candidates (Data Processor):</strong> When your platform access is sponsored, provisioned, or funded by an employer, hiring partner, or educational institution, that sponsoring organization is the Data Controller, and Whitebox Learning acts as a Data Processor under a Data Processing Addendum (DPA). We process assessment data solely pursuant to the customer&apos;s contractual instructions. When a sponsored candidate submits an access or deletion request, we verify identity, notify the designated enterprise sponsor administrator within ten (10) business days, and coordinate fulfillment. Sponsor coordination does not alter or delay applicable statutory deadlines; where a candidate exercises non-waivable statutory privacy rights under applicable legislation (such as CCPA or GDPR), Whitebox Learning fulfills the request in direct compliance with law and notifies the enterprise sponsor.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div id="section-2" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            2. Categories of Information We Collect &amp; Data Minimization
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            We collect personal information you provide directly, telemetry captured during practice assessments, and metadata generated through third-party platform integrations, structured as follows:
          </p>
          <div className="relative mb-6 overflow-x-auto">
            <table className="min-w-full bg-white text-left text-sm text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Data Category</th>
                  <th scope="col" className="px-6 py-3">Specific Elements Collected</th>
                  <th scope="col" className="px-6 py-3">Source &amp; Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 font-semibold">Account &amp; Profile Data</td>
                  <td className="px-6 py-4">Full name, email address, salted password hash, unique candidate ID, user role, profile preferences, and course enrollment records.</td>
                  <td className="px-6 py-4">User registration; identity verification, authentication, and role-based access control.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Assessment Media &amp; Audio Telemetry</td>
                  <td className="px-6 py-4">Spoken audio recordings, packaged video chunks, session timestamps, hardware readiness status, and audio telemetry.</td>
                  <td className="px-6 py-4">Browser media capture during practice interviews; speech evaluation, rubric analysis, and playback review.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Transcripts &amp; Evaluation Rubrics</td>
                  <td className="px-6 py-4">Text transcripts of practice answers, AI scoring rubrics, qualitative coaching summaries, and pacing/clarity metrics.</td>
                  <td className="px-6 py-4">Speech-to-text processing and artificial intelligence evaluation engines delivering instructional coaching.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Authorized YouTube API Data</td>
                  <td className="px-6 py-4">YouTube Video ID (11 characters), playback URL, video visibility configuration (Public, Private, or Unlisted), upload completion status, video title/description metadata, upload operational timestamps, and assessment UUID mapping.</td>
                  <td className="px-6 py-4">YouTube Data API v3; stored in assessment database records to facilitate candidate and mentor streaming playback.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Consent &amp; Authorization Audit Records</td>
                  <td className="px-6 py-4">Pre-assessment media consent choices (microphone, camera, recording storage, channel destination, audience declaration), consent event timestamp, policy version, and pseudonymized audit hash.</td>
                  <td className="px-6 py-4">Pre-assessment consent wizard; compliance verification and auditable record of user permissions. Direct identifiers are severed upon account erasure, retaining only a salted cryptographic hash, assessment UUID, consent choices, and timestamp. Re-identification keys are stored in an access-restricted vault accessible exclusively to compliance officers during the 3-year term, after which all records and keys are irreversibly purged.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">System &amp; Diagnostic Telemetry</td>
                  <td className="px-6 py-4">IP address, browser user-agent, operating system, diagnostic connection status, and application error logs.</td>
                  <td className="px-6 py-4">Automated server logs; troubleshooting, fraud prevention, rate limiting, and system security.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300 font-medium">
            <strong>Categories We DO NOT Collect:</strong> Whitebox Learning does NOT collect biometric facial recognition geometry, retinal scans, or biometric templates. We do NOT collect or store full credit card numbers directly on our servers; payment transactions are handled by accredited third-party payment processors. We do NOT collect or store candidate Google account passwords or personal YouTube credentials. We NEVER sell or rent personal information to data brokers or third parties.
          </p>
        </div>

        {/* Section 3 */}
        <div id="section-3" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            3. Assessment Media, Pre-Assessment Consent &amp; Educational AI Evaluation
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Our <strong>AI Prep</strong> module assists candidates in mastering technical interviews, communication clarity, and presentation skills through simulated practice assessments:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-3 text-gray-800 dark:text-gray-300">
            <li>
              <strong>Hardware Readiness Checks:</strong> Prior to beginning an assessment, a client-side check verifies that your microphone (and camera, where video mode is selected) is functioning and browser permissions are granted.
            </li>
            <li>
              <strong>Pre-Assessment Media &amp; Recording Consent:</strong> Immediately before any recording begins or media is transmitted, candidates are presented with a dedicated in-product Media &amp; Recording Consent step. This confirmation explicitly informs you of:
              <ul className="mt-2 list-inside list-circle pl-6 space-y-1.5 text-sm">
                <li>The educational purpose of the recording (technical evaluation, rubric scoring, speech clarity feedback, and mentor coaching).</li>
                <li>Your choice of video upload destination: Whitebox Learning&apos;s institutional educational channel (default unlisted) or your own personal YouTube channel (via Google OAuth), presented side-by-side with equal prominence.</li>
                <li>Your video visibility choices: In accordance with YouTube API guidelines, you may choose Public, Private, or Unlisted visibility, with Unlisted recommended for practice sessions.</li>
                <li>Audience classification declaration: All technical interview recordings are declared as &ldquo;Not Made for Kids&rdquo; under COPPA and YouTube policies; child-directed content is strictly prohibited.</li>
                <li>The distinction between application link security and YouTube platform visibility: within Whitebox Learning, direct links and embedded players are strictly restricted to your authenticated account and assigned instructors; however, when videos are hosted under YouTube&apos;s &ldquo;Unlisted&rdquo; setting, YouTube does not enforce authentication on the video link itself, and anyone who obtains or receives the direct URL can view the video directly on YouTube.</li>
                <li>Your explicit responsibility to avoid sharing assessment links and to refrain from disclosing sensitive personally identifiable information, financial details, or confidential proprietary information during mock practice sessions.</li>
                <li>Your right to request permanent deletion of the recording and associated records at any time.</li>
              </ul>
              Your consent choice is recorded with a secure timestamp, candidate identifier, assessment UUID, and policy version.
            </li>
            <li>
              <strong>Practice Media Processing &amp; Subprocessor Differentiation:</strong> Candidate spoken responses are handled through separate, role-specific subprocessors:
              <ul className="mt-2 list-inside list-circle pl-6 space-y-1.5 text-sm">
                <li><em>Speech-to-Text Transcription Subprocessors:</em> Candidate spoken audio chunks are transmitted securely to cloud transcription APIs solely to convert speech into textual answer transcripts. Audio chunks are processed transiently in memory and are purged from scratch storage within fifteen (15) minutes of assessment completion; audio is not retained by transcription subprocessors.</li>
                <li><em>Evaluation Model (LLM) Subprocessors:</em> Only textual transcripts and structured assessment rubric prompts are submitted to artificial intelligence language model providers. Raw video streams, audio files, facial geometry, and national identification numbers are never sent to AI model providers.</li>
                <li><em>Enterprise Zero-Data-Retention (ZDR) &amp; Non-Training Agreements:</em> All AI evaluation processing is conducted under enterprise API contracts with Zero-Data-Retention commitments and explicit contractual prohibitions against using candidate data to train public foundation models.</li>
              </ul>
            </li>
            <li>
              <strong>Formative Educational Nature &amp; Human Coaching:</strong> Automated evaluations, scoring rubrics, and feedback summaries represent formative educational practice aids designed to support learning. They do NOT constitute automated legal determinations, certified employment evaluations, or automated hiring decisions. Candidates may request human instructor review or profile correction by contacting <a href="mailto:recruiting@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>.
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div id="section-4" className="mb-10 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            4. YouTube API Services Integration, Upload Notices &amp; Data Deletion
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning integrates with and uses <strong>YouTube API Services</strong> to upload, host, stream, and manage assessment recordings, course archives, and mock interview video reviews. In strict compliance with the YouTube API Services Developer Policies and Terms of Service, we disclose the following:
          </p>
          <div className="mb-6 space-y-4 text-gray-800 dark:text-gray-300">
            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                A. Mandatory Governing Terms
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                By using video upload, assessment playback, and YouTube-integrated features on Whitebox Learning, you explicitly agree to be bound by the{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  YouTube Terms of Service
                </a>
                {" "}and acknowledge that your data will be processed in accordance with the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  Google Privacy Policy
                </a>
                .
              </p>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                B. Channel Architecture, Candidate Channel Upload Option &amp; Prominence Equity
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                In compliance with the YouTube API Services Terms of Service (including Section 9.1), Whitebox Learning provides candidates with explicit choices regarding where their mock interview recordings are hosted:
              </p>
              <ul className="mt-2 list-inside list-disc pl-2 space-y-1.5 text-sm">
                <li>
                  <strong>Option 1: Upload to Candidate&apos;s Own Personal YouTube Channel (§9.1(a)):</strong> Candidates may connect their personal YouTube account via Google OAuth to upload their mock interview recordings directly to their own YouTube channel. In accordance with YouTube API Required Minimum Functionality, our upload interface enables candidates to choose between Public, Private, and Unlisted visibility. We recommend selecting &ldquo;Unlisted&rdquo; visibility on your channel to enable Whitebox Learning to evaluate your practice session and embed playback in your dashboard via standard YouTube APIs. If you configure the video as &ldquo;Private&rdquo;, YouTube restricts external access unless active Google OAuth read permissions are granted and maintained; if OAuth permissions are revoked, expired, or restricted, automated transcription, rubric scoring, and platform playback will be unavailable.
                </li>
                <li>
                  <strong>Option 2: Upload to Whitebox Learning Educational Channel (§9.1(b)):</strong> Candidates may elect to upload their recording to Whitebox Learning&apos;s institutional educational channel as an unlisted video for automated evaluation and instructor coaching.
                </li>
                <li>
                  <strong>Prominence Equity Guarantee (§9.1(a) &amp; §9.1(b)(ii)):</strong> In the product user interface, onboarding wizard, and session preferences, the option to upload to the candidate&apos;s own YouTube channel is presented side-by-side and <em>at least as prominently</em> as the option to upload to Whitebox Learning&apos;s institutional channel. Candidates make an affirmative, voluntary selection before any recording or upload occurs; neither option is selected silently by default.
                </li>
                <li>
                  <strong>Ownership Boundary &amp; Limited License Allocation (§9.1(b)(i)):</strong>
                  <ul className="mt-1 list-inside list-circle pl-4 space-y-1 text-xs">
                    <li><strong>Candidate Original Media (Candidate IP):</strong> You retain 100% full copyright, title, ownership, and moral rights in and to your original audiovisual recordings, voice, spoken responses, and likeness. Whitebox Learning acquires NO ownership rights in your videos. You grant Whitebox Learning a limited, non-exclusive, revocable, royalty-free license strictly to capture, temporarily buffer, transcribe, evaluate using automated models, host on YouTube for review (on the institutional or personal channel per your selection), and display your assessment recordings solely to provide you with educational feedback, instructor mentorship, and technical practice evaluation.</li>
                    <li><strong>Candidate Transcripts &amp; Evaluation Reports (Candidate Personal Data):</strong> Transcripts of your spoken responses and individualized scoring feedback constitute personal data. While your account remains active, you may view and export your reports. Upon account closure or a verified deletion request, individual transcripts and score reports are permanently purged within thirty (30) days.</li>
                    <li><strong>Platform Proprietary Systems &amp; Curriculum (Whitebox Learning IP):</strong> Whitebox Learning retains exclusive ownership of its proprietary scoring algorithms, rubric criteria, machine learning prompts, assessment problem banks, and platform feedback analytics.</li>
                  </ul>
                </li>
                <li>
                  <strong>Deterministic 1:1 Indexing:</strong> Every uploaded video is deterministically and uniquely indexed to the candidate&apos;s specific assessment UUID and candidate identifier. Deletion requests execute strictly against the verified video ID mapped to that specific record, ensuring that deleting a candidate record never affects unrelated recordings or other candidates.
                </li>
              </ul>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                C. Video Visibility Realities, Verbatim Upload Notice &amp; &ldquo;Not Made for Kids&rdquo; Declaration (§9.1)
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Practice interview recordings uploaded under our institutional channel are configured with YouTube&apos;s &ldquo;Unlisted&rdquo; privacy setting by default. While unlisted videos do not appear in public YouTube search results, channel pages, or public recommendation feeds, <strong>unlisted videos are not private or access-controlled by Google</strong>. Anyone who possesses or receives the direct URL may view and share the video directly on YouTube without logging in. Within the Whitebox Learning platform, direct links and embedded players are restricted to authenticated candidate accounts and assigned instructors; however, the user interface never characterizes unlisted videos as &ldquo;private&rdquo; or &ldquo;access-controlled by YouTube.&rdquo; Users must exercise strict personal discretion, avoid sharing assessment links, and refrain from disclosing sensitive personal or confidential information during recordings.
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                In strict compliance with <strong>Section 9.1 (&ldquo;Required Notice&rdquo;) of the YouTube API Services Terms of Service</strong>, the screen immediately adjacent to the user action that initiates recording submission and upload displays the following exact required warning with the device-appropriate linked URL:
              </p>
              <div className="mt-2 rounded bg-gray-100 p-3.5 text-xs font-mono leading-relaxed text-gray-900 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                By clicking &apos;upload,&apos; you certify that the content you are uploading complies with the YouTube Terms of Service (including the YouTube Community Guidelines) at{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 underline dark:text-blue-400"
                >
                  https://www.youtube.com/t/terms
                </a>
                {" "}[or{" "}
                <a
                  href="http://m.youtube.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 underline dark:text-blue-400"
                >
                  http://m.youtube.com/terms
                </a>
                {" "}for mobile devices]. Please be sure not to violate others&apos; copyright or privacy rights.
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                Our application dynamically detects the device environment: desktop and personal computer browsers link directly to <span className="font-mono">https://www.youtube.com/t/terms</span>, while mobile device interfaces link directly to <span className="font-mono">http://m.youtube.com/terms</span>. All recorded content submitted for upload must also strictly comply with the{" "}
                <a
                  href="https://www.youtube.com/howyoutubeworks/policies/community-guidelines/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  YouTube Community Guidelines
                </a>
                {" "}(or mobile: <a href="http://m.youtube.com/community_guidelines" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline dark:text-blue-400">http://m.youtube.com/community_guidelines</a>).
              </p>
              <div className="mt-3 rounded border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-700 text-xs leading-relaxed">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Audience Declaration &amp; Prohibition of Child-Directed Content (&ldquo;Made for Kids&rdquo; COPPA Compliance):
                </p>
                <p className="mt-1">
                  Whitebox Learning is designed exclusively for adult technical career preparation; <strong>content directed to children is strictly prohibited on the platform</strong>. In compliance with YouTube API Services upload requirements for non-child-directed applications:
                </p>
                <ul className="mt-1.5 list-inside list-disc pl-2 space-y-1">
                  <li>Before initiating any upload, the upload interface presents a mandatory audience confirmation wherein candidates must affirmatively verify the declaration: <em>&ldquo;I certify that this technical mock interview recording is Not Made for Kids and contains no child-directed content.&rdquo;</em></li>
                  <li>The interface explicitly notifies candidates who elect to upload to their personal YouTube channels that they must confirm this &ldquo;Not Made for Kids&rdquo; audience classification on YouTube Studio desktop (<a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">https://studio.youtube.com</a>) immediately after uploading.</li>
                  <li>Candidates expressly represent and warrant that all submitted mock interviews are strictly professional adult educational recordings containing zero child-directed content under COPPA and YouTube Community Guidelines.</li>
                </ul>
              </div>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                D. Stored YouTube API Data Inventory, Secrets Isolation &amp; Routine 30-Day Refresh
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Whitebox Learning enforces strict data minimization. We store only the following YouTube API data elements across our systems:
              </p>
              <ul className="mt-2 list-inside list-disc pl-2 space-y-1 text-sm">
                <li><strong>Live MySQL Application Database:</strong> YouTube Video ID (unique 11-character identifier), playback URL (<span className="font-mono">https://youtube.com/watch?v=...</span>), visibility configuration, upload confirmation status, video title and educational description metadata, assessment UUID mapping, operational start/completion timestamps, and in-product consent metadata.</li>
                <li><strong>Server-Side Secrets &amp; Environment Variables:</strong> Institutional OAuth 2.0 credentials (<span className="font-mono">YOUTUBE_CLIENT_ID</span>, <span className="font-mono">YOUTUBE_CLIENT_SECRET</span>, and <span className="font-mono">YOUTUBE_REFRESH_TOKEN</span>) are stored exclusively in encrypted server-side environment variables and secrets managers. They are never written to candidate databases, client browser bundles, Redis cache, or server application logs.</li>
                <li><strong>Ephemeral Processing Cache:</strong> Redis and Celery queues store only transient task identifiers and progress percentages with a short time-to-live (TTL). No video streams, OAuth secrets, or YouTube tokens are cached.</li>
                <li><strong>Worker Scratch Disks:</strong> Temporary media chunks and assembled recordings generated during live sessions are stored in ephemeral scratch storage. Upon verified upload completion to YouTube and local audio extraction (within 15 minutes of assessment completion), temporary media is permanently purged immediately. In the event of a network interruption or upload failure, temporary chunks are held exclusively in the automated retry queue for a maximum bounded window of twenty-four (24) hours, after which an automated cleanup daemon permanently purges the files and logs the cleanup outcome. Temporary media is strictly excluded from backups.</li>
              </ul>
              <p className="mt-2 text-sm leading-relaxed">
                <strong>Routine 30-Day API Data Refresh &amp; Expiration (Developer Policy III.E.1):</strong> Under YouTube API Services Developer Policies, API data must be refreshed or deleted within thirty (30) calendar days. Whitebox Learning actively executes scheduled synchronization routines that query the YouTube Data API to confirm that stored video IDs and playback metadata remain valid and reflect current YouTube platform state. Any cached YouTube API data that cannot be re-validated or exceeds 30 calendar days without active re-verification is automatically expired and purged from live application storage.
              </p>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                E. YouTube API Data Deletion Mandates, Verification Realities &amp; Backup Replay Reconciliation
              </p>
              <div className="mt-1 text-sm leading-relaxed space-y-3">
                <p>
                  <strong>1. Company 7-Day Deletion Commitment for Stored YouTube API Data:</strong> The official YouTube API Services Developer Policies establish a general outer limit of thirty (30) calendar days for deleting or refreshing stored API data, while requiring prompt deletion upon revocation or qualifying request. Whitebox Learning voluntarily enforces a <strong>stricter company commitment of seven (7) calendar days</strong> to permanently purge candidate-associated stored YouTube API data (YouTube Video IDs, playback URLs, video titles, descriptions, upload confirmation statuses, API tokens, and assessment reference mappings) from live production databases, read-replicas, and active caches upon:
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li><strong>User Deletion Request:</strong> A candidate request to delete an assessment recording submitted to <a href="mailto:recruiting@whitebox-learning.com" className="font-semibold text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>.</li>
                  <li><strong>Account Closure:</strong> Termination or closure of a platform user account.</li>
                  <li><strong>In-App Client Revocation:</strong> Disconnection of a connected Google account within the Whitebox Learning portal.</li>
                  <li><strong>Detected External Google Security Settings Revocation:</strong> Revocation of Whitebox Learning access via the <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline dark:text-blue-400">Google Security Permissions Page</a> detected by API client token refresh failure (e.g. <span className="font-mono">invalid_grant</span>).</li>
                </ul>
                <p className="text-xs">
                  <em>Scope Distinction:</em> This company 7-day commitment applies specifically to stored YouTube API data. General non-YouTube platform records (such as course progression, candidate profiles, and billing transactions) are handled under statutory privacy frameworks (CCPA/GDPR) and processed within statutory timelines (within 30 days).
                </p>

                <p>
                  <strong>2. Local Deletion vs. Remote Hosted Video Realities:</strong> Deleting local application records does not inherently verify or guarantee that the hosted video has been removed from YouTube. Whitebox Learning enforces separate, verifiable operational tracks:
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li><strong>Institutional Channel Recordings:</strong> For recordings hosted on Whitebox Learning&apos;s institutional channel, our automated pipeline dispatches a <span className="font-mono">videos.delete</span> command via the YouTube Data API. Deletion is confirmed via HTTP 204 or verification query (<span className="font-mono">videos.list</span> returning 404 / empty). If transient errors (HTTP 500, 503, 429) occur, the request is retried with exponential backoff for up to 72 hours. If unresolved at 72 hours, an automated compliance alert escalates to engineering compliance operations under an administrative SLA to execute manual removal on the institutional channel. The internal 72-hour retry window is an operational recovery mechanism for remote video deletion, not an extension of our 7-calendar-day local data purge commitment.</li>
                  <li><strong>Personal Channel Recordings &amp; OAuth Revocation:</strong> For recordings uploaded to the candidate&apos;s own YouTube channel, remote deletion via API requires active Google OAuth permissions. If a candidate revokes OAuth access prior to deletion execution, Whitebox Learning has no technical capability to delete videos on the candidate&apos;s personal channel. In this scenario, all local application data and API references are permanently purged within seven (7) calendar days, candidate status is marked as <span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span>, and the candidate is provided written guidance to delete the video directly via <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">YouTube Studio</a>.</li>
                  <li><strong>Granular Lifecycle Status Reporting:</strong> The platform tracks and communicates independent statuses: Application Data: <span className="font-mono">LOCAL_DATA_PURGED</span>; Hosted Video: <span className="font-mono">REMOTE_DELETION_CONFIRMED</span> or <span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span>. Severing local database links is never represented as remote video deletion.</li>
                </ul>

                <p>
                  <strong>3. Operational Recovery Tombstone Lifecycle &amp; 7-Day Boundary:</strong> To prevent orphaned remote videos during temporary API outages, an operational recovery tombstone is stored in an isolated administrative table.
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li><strong>Data Content &amp; Access Restriction:</strong> The tombstone is a restricted operational record containing solely: internal Deletion Job UUID, external YouTube Video ID, attempt counter, timestamp, and HTTP error code. It contains zero candidate personal data, names, or emails, and is accessible strictly to automated deletion workers and compliance administrators.</li>
                  <li><strong>At the 7-Day Boundary:</strong> All candidate-facing application records, profile links, video titles, and assessment references are guaranteed purged within seven (7) calendar days. If a remote deletion call against the institutional channel experiences transient failures, the isolated tombstone persists under the automated retry queue (up to 72 hours) and administrative escalation SLA to complete manual channel removal. In no event is an operational tombstone retained beyond thirty (30) calendar days from the initial request (strictly within YouTube Developer Policy outer limits).</li>
                  <li><strong>Permanent Destruction:</strong> Once remote deletion is confirmed (<span className="font-mono">REMOTE_DELETION_CONFIRMED</span>) or manual institutional channel removal is verified, the tombstone is <strong>immediately and permanently purged</strong>. For personal channel uploads where OAuth was revoked, the tombstone is purged as soon as status is recorded as <span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span> and the user is notified, well within seven (7) calendar days. The platform never silently discards tombstone records prior to remote deletion confirmation or candidate notification.</li>
                </ul>

                <p>
                  <strong>4. Consent Audit Records &amp; Pseudonymized Retention Lifecycle:</strong> To demonstrate that pre-assessment recording consent was lawfully obtained, Whitebox Learning enforces a finalized corporate compliance retention policy:
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li><strong>Retention Period &amp; Legal Basis:</strong> Whitebox Learning retains pre-assessment consent audit records for a finalized period of <strong>three (3) years</strong>. This retention is grounded in Whitebox Learning&apos;s legitimate business interests and legal necessity to maintain auditable evidence of regulatory compliance and contractual consent during the applicable statutory limitation period (including California statutory limitation periods for written contract and compliance claims).</li>
                  <li><strong>Pseudonymization on Account Erasure:</strong> When an account is closed or an erasure request is executed, direct personal identifiers (candidate name, email address, video URLs, and assessment responses) are permanently deleted from all active application tables. The compliance audit log retains only a salted one-way cryptographic hash of the candidate identifier, assessment UUID, consent category flags, policy version, and timestamp.</li>
                  <li><strong>Key Enclave Access &amp; Sunset Destruction:</strong> The cryptographic salt and lookup keys are maintained in an isolated, access-controlled security enclave accessible exclusively by authorized compliance officers and legal counsel solely if required to respond to a regulatory inquiry or legal claim. Because re-identification is restricted to authorized personnel under formal legal compulsion, the record is <em>pseudonymized</em> (not anonymous) during the 3-year term. Upon reaching the conclusion of the 3-year retention schedule, the audit record and its associated cryptographic mapping keys/salt are <strong>permanently and irreversibly destroyed</strong> by automated lifecycle jobs, extinguishing any technical possibility of re-identification.</li>
                </ul>

                <p>
                  <strong>5. Disaster Recovery Backup Reconciliation &amp; Deletion Replay Log:</strong> Database disaster recovery snapshots are automated, immutable point-in-time archives maintained on a rolling retention cycle (up to 30 days). Because snapshots are immutable archives that cannot be modified in-place without corrupting cryptographic image integrity, Whitebox Learning reconciles backup archives with deletion commitments through an <strong>Automated Deletion Replay Log</strong>: in the event that an emergency disaster recovery database restoration is performed, the recovery pipeline automatically executes the deletion replay log <em>prior to</em> exposing restored instances to live production network traffic, instantly re-verifying and re-purging any previously deleted YouTube API records or personal data. Snapshots age out naturally and permanently after their rolling 30-day lifecycle.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div id="section-5" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            5. Purposes &amp; Legal Bases for Processing
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            We process personal data under legitimate business interests, contractual necessity, legal compliance, and user consent for the following purposes:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li><strong>Delivering Platform Training Services:</strong> Providing course curriculum, scheduling live classroom lectures, orchestrating AI Prep interviews, and presenting real-time feedback (Contractual Necessity).</li>
            <li><strong>Educational Analytics &amp; Scoring:</strong> Generating transcriptions and rubric evaluations to help candidates improve interview performance (Consent &amp; Contractual Necessity).</li>
            <li><strong>Hosting &amp; Video Review:</strong> Facilitating high-performance video streaming of mock interviews and training lectures via YouTube API Services (Consent &amp; User Request).</li>
            <li><strong>Account Administration:</strong> Managing profile credentials, processing password resets, sending curriculum alerts, and verifying candidate enrollment (Contractual Necessity).</li>
            <li><strong>Regulatory Compliance:</strong> Demonstrating documented user consent, maintaining audit integrity, and fulfilling privacy requests (Legal Obligation &amp; Legitimate Interests).</li>
            <li><strong>System Integrity &amp; Security:</strong> Monitoring traffic, preventing abusive automated scraping, defending against attacks, and auditing system logs (Legitimate Interests).</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div id="section-6" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            6. Subprocessors, AI Model Providers &amp; Infrastructure
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            We partner with trusted third-party service providers and subprocessors under strict data protection agreements:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li><strong>Google LLC / YouTube API Services:</strong> Video ingestion, streaming infrastructure, and video hosting pursuant to the YouTube Terms of Service and Google Privacy Policy.</li>
            <li><strong>Speech-to-Text Transcription Subprocessors:</strong> Cloud transcription APIs utilized to convert candidate spoken audio into textual answer transcripts. Audio is processed transiently in memory to produce text and is purged within 15 minutes of session completion.</li>
            <li><strong>Evaluation Model (LLM) Subprocessors:</strong> Cloud-based language model APIs utilized strictly to evaluate text transcripts against structured educational rubrics. <em>Zero-Data-Retention (ZDR):</em> Subprocessors process text solely in memory to return scores and feedback; candidate transcripts are never retained by providers or utilized to train public foundation models.</li>
            <li><strong>Cloud &amp; Database Infrastructure:</strong> Secure cloud compute servers, managed relational databases, and encrypted object storage located in the United States.</li>
            <li><strong>Communication Providers:</strong> Transactional email service providers utilized for account notifications, password resets, and score report delivery.</li>
          </ul>
        </div>

        {/* Section 7 */}
        <div id="section-7" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            7. Authoritative Data Retention &amp; Deletion Schedule
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            We retain personal data only for as long as necessary to fulfill the educational purposes for which it was gathered. Our authoritative retention and deletion schedule is structured as follows:
          </p>
          <div className="relative mb-6 overflow-x-auto">
            <table className="min-w-full bg-white text-left text-sm text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-300">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Data Category</th>
                  <th scope="col" className="px-6 py-3">Retention Period</th>
                  <th scope="col" className="px-6 py-3">Clock Start Event</th>
                  <th scope="col" className="px-6 py-3">Deletion Mechanism &amp; Fallback</th>
                  <th scope="col" className="px-6 py-3">Scope &amp; Exceptions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 font-semibold">Temporary Media Chunks &amp; Scratch Files</td>
                  <td className="px-6 py-4">Immediate upon upload (max 15 mins); max 24 hours for interrupted upload retry queue.</td>
                  <td className="px-6 py-4">Assessment recording capture completion.</td>
                  <td className="px-6 py-4">Automated cleanup daemon immediately purges temporary media upon verified YouTube upload and audio extraction (within 15 minutes). For interrupted uploads, chunks are held strictly in an automated retry queue for up to 24 hours, after which an automated cleanup worker permanently purges unrecovered files and logs the cleanup event.</td>
                  <td className="px-6 py-4">Worker scratch directories and ephemeral staging storage; strictly excluded from permanent database backups.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Authorized YouTube API Data</td>
                  <td className="px-6 py-4">Active enrollment (routinely refreshed/expired every 30 days per Developer Policy III.E.1); permanently deleted within 7 calendar days of trigger under company commitment.</td>
                  <td className="px-6 py-4">User deletion request, account closure, in-app client revocation, or detected Google Security Settings revocation.</td>
                  <td className="px-6 py-4">Automated deletion job permanently purging candidate YouTube API records from live databases and caches within 7 calendar days; concurrent remote deletion via YouTube Data API. Routine 30-day refresh purges stale cached API data.</td>
                  <td className="px-6 py-4">All live database tables, read-replicas, and active caches. Disaster recovery backups are automated, immutable point-in-time archives (retained up to 30 days); pre-restoration deletion replay logs re-verify and re-purge deleted records before restored instances serve live traffic.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Operational Recovery Tombstones</td>
                  <td className="px-6 py-4">Duration of remote deletion verification (up to 72 hours for retries, or duration of manual escalation SLA; max 30 days outer limit per YouTube Developer Policy).</td>
                  <td className="px-6 py-4">Remote deletion dispatch event.</td>
                  <td className="px-6 py-4">Immediately and permanently purged upon confirmed remote deletion (<span className="font-mono">REMOTE_DELETION_CONFIRMED</span>), completion of manual engineering escalation, or candidate notification for revoked OAuth (<span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span>).</td>
                  <td className="px-6 py-4">Isolated administrative recovery table. Contains minimal operational data (Job UUID, Video ID, attempt count, error code; no candidate profile data). Restricted to deletion workers and compliance administrators.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Transcripts &amp; Score Reports</td>
                  <td className="px-6 py-4">Enrollment duration plus 12 months (or purged within 30 days upon verified deletion request / account closure).</td>
                  <td className="px-6 py-4">Course completion, graduation, account closure, or verified user deletion request.</td>
                  <td className="px-6 py-4">Scheduled database purge job or user deletion workflow permanently removing transcripts, rubric scores, and AI feedback.</td>
                  <td className="px-6 py-4">Subject only to narrow statutory retention exceptions (isolated and access-restricted where legally required for tax compliance, accounting audits, or active litigation holds).</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Consent &amp; Authorization Audit Records</td>
                  <td className="px-6 py-4">Three (3) years (finalized corporate policy based on statutory limitation periods for contract/compliance claims).</td>
                  <td className="px-6 py-4">Pre-assessment consent event timestamp.</td>
                  <td className="px-6 py-4">Automated lifecycle purge job. Upon candidate account erasure, records are pseudonymized (direct identifiers scrubbed, retaining cryptographic hash, UUID, timestamp, policy version). Access is restricted to compliance and legal officers. Keys and records are irreversibly purged at end of 3-year term.</td>
                  <td className="px-6 py-4">Compliance audit table maintained strictly for legal defense and regulatory audits. Irreversibly destroyed at conclusion of 3-year schedule along with mapping keys.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">User Account Credentials &amp; Profiles</td>
                  <td className="px-6 py-4">Active duration of account.</td>
                  <td className="px-6 py-4">User-initiated account closure or formal program termination.</td>
                  <td className="px-6 py-4">Deactivation of authentication tokens; personal identifiers scrubbed from database records within 30 days of closure.</td>
                  <td className="px-6 py-4">Essential billing transaction history retained for statutory accounting and tax compliance (up to 7 years).</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">System &amp; Diagnostic Logs</td>
                  <td className="px-6 py-4">Up to 90 days.</td>
                  <td className="px-6 py-4">Server event generation timestamp.</td>
                  <td className="px-6 py-4">Automated rolling log rotation, overwrite, and permanent deletion.</td>
                  <td className="px-6 py-4">Server-level access and security auditing logs; contains IP addresses and user agents.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 8 */}
        <div id="section-8" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            8. Your Privacy Rights &amp; Operational Fulfillment Workflows
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Depending on your jurisdiction, you hold statutory rights under privacy frameworks such as the California Consumer Privacy Act (CCPA/CPRA) and General Data Protection Regulation (GDPR):
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li><strong>Right to Know &amp; Access:</strong> You may request a copy of the personal information we maintain about you, including assessment history, transcripts, and scores.</li>
            <li><strong>Right to Correction:</strong> You may request rectification of inaccurate profile information or transcript records.</li>
            <li><strong>Right to Deletion:</strong> You may request deletion of your personal data. Stored YouTube API data is deleted within seven (7) calendar days under company policy; general personal data within thirty (30) days.</li>
            <li><strong>Right to Opt-Out:</strong> We do not sell your personal data or share it for cross-context behavioral advertising; therefore, no opt-out is required.</li>
            <li><strong>Non-Discrimination:</strong> We will never discriminate against you for exercising your legal privacy rights.</li>
          </ul>
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-3 text-sm text-gray-800 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white">
              Standardized Privacy Request &amp; Fulfillment Workflow:
            </p>
            <p>
              <strong>1. Submission &amp; Acknowledgment:</strong> Submit your request to <a href="mailto:recruiting@whitebox-learning.com" className="font-semibold text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>. Our compliance office acknowledges receipt within ten (10) business days and verifies your identity against your registered account email and assessment records.
            </p>
            <p>
              <strong>2. Direct Candidates:</strong> Once identity is verified, the deletion lifecycle is initiated: authorized YouTube API data is purged from live systems within seven (7) calendar days under company commitment; general personal data is purged within thirty (30) days. Written confirmation is provided upon completion.
            </p>
            <p>
              <strong>3. Enterprise &amp; Sponsored Candidates:</strong> When access is sponsored by an employer or educational client, Whitebox Learning acts as a Data Processor. We verify your identity, promptly notify the designated enterprise sponsor administrator within ten (10) business days, and coordinate fulfillment per customer agreement instructions. Where you exercise non-waivable statutory rights under applicable law, we fulfill the request directly in compliance with legal deadlines and notify the sponsor.
            </p>
          </div>
        </div>

        {/* Section 9 */}
        <div id="section-9" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            9. Security Safeguards &amp; Credential Isolation Controls
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            We implement administrative, physical, and technical safeguards to protect your personal information:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li><strong>Encryption in Transit:</strong> Enforced HTTPS/TLS (TLS 1.2/1.3) protocols across web endpoints, media streaming, and client-server communications.</li>
            <li><strong>Encryption at Rest:</strong> Application databases and cloud storage backups are encrypted at rest using industry-standard AES-256 cryptography.</li>
            <li><strong>Access Control &amp; Route Protection:</strong> Application endpoints and candidate dashboards are protected by JSON Web Token (JWT) authentication, role-based access control (RBAC), and server-side authorization checks verifying that candidate identifiers match the assessment UUID, preventing unauthorized access via URL tampering.</li>
            <li><strong>API Credential Isolation:</strong> YouTube OAuth credentials, refresh tokens, and third-party API keys are stored exclusively in isolated server-side environment variables and secrets managers, and are never exposed in client code or frontend bundles.</li>
            <li><strong>Backup Restoration Replay Pipeline:</strong> In the event of a database restoration, the Automated Deletion Replay Log ensures any records deleted prior to restoration are immediately purged before live network traffic is served.</li>
          </ul>
        </div>

        {/* Section 10 */}
        <div id="section-10" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            10. Children&apos;s Privacy &amp; Prohibition of Child-Directed Content
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            The Services are designed strictly for adult professionals, college students, and individuals seeking career advancement. Whitebox Learning does not knowingly solicit or collect personal information from individuals under eighteen (18) years of age (or under sixteen (16) where applicable under local regulations). If we learn that personal data from an underage user has been inadvertently collected, we will take prompt operational steps to delete the records from our servers and YouTube storage within seven (7) calendar days.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Prohibition of Child-Directed Content:</strong> All interview assessments and video uploads on Whitebox Learning are classified as &ldquo;Not Made for Kids&rdquo; under COPPA and YouTube API policies. The platform strictly prohibits the creation, recording, or uploading of child-directed content.
          </p>
        </div>

        {/* Section 11 */}
        <div id="section-11" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            11. Cross-Border Data Transfers &amp; Transfer Mechanisms
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning operates within the United States. If you access our platform from international jurisdictions (such as the European Economic Area, United Kingdom, or Canada), your personal data is transferred to and processed in the United States, where data protection standards may differ from those in your home country.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Where cross-border transfers occur from regions requiring recognized adequacy or transfer mechanisms, Whitebox Learning relies on approved legal safeguards, including Standard Contractual Clauses (SCCs) adopted by the European Commission, along with supplementary technical controls including transport encryption (TLS) and encryption at rest (AES-256).
          </p>
        </div>

        {/* Section 12 */}
        <div id="section-12" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            12. Policy Modifications &amp; Privacy Office Contacts
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            We may revise this Privacy Policy periodically to reflect enhancements to our platforms, modifications to YouTube API integration workflows, or statutory updates. When modifications occur, we will post the revised policy with a prominent notice on our website and update the effective version date.
          </p>
          <p className="mb-6 leading-relaxed text-gray-800 dark:text-gray-300">
            For privacy inquiries, data deletion requests, or questions regarding our YouTube API Services integration, contact our privacy compliance team:
          </p>
          <div className="rounded-md bg-gray-50 p-4 font-mono text-sm dark:bg-gray-700 space-y-0.5">
            <div><strong>Whitebox Learning, Inc. — Privacy &amp; Compliance Office</strong></div>
            <div>Attn: Data Privacy Officer</div>
            <div>6500 Dublin Blvd., Ste. 218</div>
            <div>Dublin, CA 94568, United States</div>
            <div>Direct Privacy Email: <a href="mailto:recruiting@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a></div>
            <div>General Support: <a href="mailto:info@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">info@whitebox-learning.com</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}
