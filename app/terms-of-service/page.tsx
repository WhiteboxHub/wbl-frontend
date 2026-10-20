import Layout from "@/components/Common/Layout";

export const metadata = {
  title: "Terms of Service - Whitebox Learning",
  description:
    "Terms of Service governing the use of Whitebox Learning platforms, interview assessments, training programs, and YouTube Data API Services integration.",
};

export default function TermsOfService() {
  return (
    <div className="container px-4 pb-16 sm:px-6">
      {/* Navigation */}
      <nav className="mt-20 flex h-auto flex-col items-start justify-center sm:mt-28 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-center text-2xl font-bold text-black dark:text-white sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
          Terms of Service
        </h1>
        <div className="hidden sm:block">
          <Layout currentPage="Terms of Service" />
        </div>
      </nav>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-12 shadow-sm dark:border-gray-800 dark:bg-dark">
        <div className="mb-6 flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <span>Effective Date: October 15, 2026</span>
          <span>Last Updated: October 15, 2026</span>
        </div>

        <p className="mb-6 leading-relaxed text-gray-800 dark:text-gray-300">
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and <strong>Whitebox Learning, Inc.</strong>, governing your access to and use of our platform website (
          <a href="https://whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">
            https://whitebox-learning.com
          </a>
          ), our AI Prep interview assessment platform, student portal, instructor coaching portals, and associated software applications.
        </p>

        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-gray-700 dark:text-blue-200">
          <strong>Mandatory Third-Party Notice regarding YouTube API Services:</strong> Whitebox Learning utilizes <strong>YouTube API Services</strong> to support video processing, recording hosting, and playback of candidate mock interviews and instructional lectures. By accessing or using video-enabled features on Whitebox Learning, you explicitly agree to be bound by the{" "}
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
            <a href="#tos-1" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Acceptance of Terms &amp; Eligibility
            </a>
          </li>
          <li>
            <a href="#tos-2" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Platform Services, User Roles &amp; AI Prep
            </a>
          </li>
          <li>
            <a href="#tos-3" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              User Accounts, Authentication &amp; Security
            </a>
          </li>
          <li>
            <a href="#tos-4" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Assessment Media, Pre-Assessment Consent &amp; Educational Feedback
            </a>
          </li>
          <li>
            <a href="#tos-5" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              YouTube API Services Integration, Upload Notices &amp; Data Deletion
            </a>
          </li>
          <li>
            <a href="#tos-6" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Intellectual Property &amp; Content Ownership Allocation
            </a>
          </li>
          <li>
            <a href="#tos-7" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Acceptable Use Policy &amp; Code of Conduct
            </a>
          </li>
          <li>
            <a href="#tos-8" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Commercial Terms &amp; Tuition
            </a>
          </li>
          <li>
            <a href="#tos-9" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Third-Party Integrations &amp; Subprocessors
            </a>
          </li>
          <li>
            <a href="#tos-10" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Data Retention, Storage Lifecycle &amp; Deletion Schedules
            </a>
          </li>
          <li>
            <a href="#tos-11" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Warranty Disclaimers &amp; As-Is Nature
            </a>
          </li>
          <li>
            <a href="#tos-12" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Limitation of Liability &amp; Statutory Savings Clause
            </a>
          </li>
          <li>
            <a href="#tos-13" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Indemnification
            </a>
          </li>
          <li>
            <a href="#tos-14" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Dispute Resolution, Governing Law &amp; Arbitration
            </a>
          </li>
          <li>
            <a href="#tos-15" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Term, Termination &amp; Deletion Commitments
            </a>
          </li>
          <li>
            <a href="#tos-16" className="font-medium hover:text-blue-600 dark:hover:text-blue-400">
              Modifications &amp; General Legal Inquiries
            </a>
          </li>
        </ol>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        {/* Section 1 */}
        <div id="tos-1" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            1. Acceptance of Terms &amp; Eligibility
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            By accessing, browsing, registering an account with, or utilizing the Services provided by Whitebox Learning, Inc., you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately cease all access to and use of our platform.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Age and Authority:</strong> You represent and warrant that you are at least eighteen (18) years of age (or the legal age of majority in your jurisdiction) and possess full legal capacity to enter into this contract. If you access or use the Services on behalf of a company, educational institution, or other entity, you represent and warrant that you have full corporate authority to bind that entity to these Terms.
          </p>
        </div>

        {/* Section 2 */}
        <div id="tos-2" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            2. Platform Services, User Roles &amp; AI Prep
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning delivers immersive technical education, career mentoring, and interview readiness tools for technology professionals. Key user roles and features include:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li><strong>Candidates &amp; Students:</strong> Enrollees participating in training modules, simulated mock interviews, coding exercises, and automated feedback reviews.</li>
            <li><strong>Instructors &amp; Mentors:</strong> Authorized educators providing live lectures, curriculum instruction, rubric customization, and direct qualitative evaluation.</li>
            <li><strong>AI Prep Module:</strong> An interactive assessment engine combining audio capture, automated transcription, formative practice feedback, and video hosting with access to recording links managed through the Whitebox Learning application.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div id="tos-3" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            3. User Accounts, Authentication &amp; Security
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            To access certain features, you must create a user account. You agree to provide accurate, current, and complete registration information and to keep your credentials updated.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify Whitebox Learning immediately at <a href="mailto:recruiting@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a> if you suspect any unauthorized access to or compromise of your account. Whitebox Learning will not be liable for losses caused by unauthorized use of your credentials.
          </p>
        </div>

        {/* Section 4 */}
        <div id="tos-4" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            4. Assessment Media, Pre-Assessment Consent &amp; Educational Feedback
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            When participating in AI Prep assessments, mock interviews, or recorded class sessions:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li>
              <strong>Pre-Assessment Media &amp; Recording Consent:</strong> Prior to beginning any assessment or transmitting audio or video media, you are presented with an in-product Media &amp; Recording Consent step. This confirmation presents your upload destination choices (Whitebox Learning&apos;s institutional educational channel or your own personal YouTube channel) side-by-side with equal prominence without silent pre-selection, details the educational evaluation purpose, explains the distinction between platform link access controls and YouTube&apos;s unlisted platform visibility, requires your affirmative declaration that the recording is &ldquo;Not Made for Kids&rdquo;, and records your voluntary consent.
            </li>
            <li>
              <strong>Candidate Ownership &amp; Intellectual Property Boundary:</strong>
              <ul className="mt-1 list-inside list-circle pl-4 space-y-1 text-xs">
                <li><strong>Candidate Original Recordings (Candidate IP):</strong> You retain 100% sole copyright, title, ownership, and moral rights in and to your original audiovisual recordings, voice, spoken answers, and likeness. Whitebox Learning acquires NO ownership rights in your videos. You grant Whitebox Learning a limited, non-exclusive, revocable, royalty-free license strictly to capture, temporarily buffer, transcribe, evaluate using automated models, host on YouTube for review (on the institutional or personal channel per your selection), and display your assessment recordings solely to provide you with educational feedback, instructor mentorship, and technical practice evaluation. Whitebox Learning does not use your assessment recordings to train public foundation artificial intelligence models.</li>
                <li><strong>Candidate Transcripts &amp; Individual Feedback Reports (Candidate Personal Data):</strong> Transcripts of your spoken responses and individualized scoring feedback constitute personal data. While your account is active, you may view and export your reports. Upon account closure or a verified deletion request, individual transcripts and score reports are permanently purged within thirty (30) days.</li>
                <li><strong>Platform Proprietary Systems &amp; Curriculum (Whitebox Learning IP):</strong> Whitebox Learning retains exclusive ownership of its proprietary scoring algorithms, rubric criteria, machine learning prompts, assessment problem banks, and platform feedback analytics.</li>
              </ul>
            </li>
            <li>
              <strong>Distinct License Termination Triggers:</strong> The limited license to process your recordings terminates immediately with respect to a specific recording upon your submission of a verified deletion request, across all recordings upon account closure, or for personal channel connectivity upon revoking Google OAuth access (which revokes API integration immediately, while preserving candidate-controlled media on your personal YouTube channel).
            </li>
            <li>
              <strong>Temporary Media Storage &amp; Cleanup Lifecycle:</strong> Temporary worker scratch files and media chunks generated during recording are held in ephemeral scratch storage. Upon verified upload completion and audio extraction, temporary files are permanently purged immediately (within 15 minutes of session completion). For interrupted uploads, chunks are held strictly in an automated retry queue for up to twenty-four (24) hours, after which an automated cleanup worker permanently purges unrecovered files and logs the cleanup outcome; temporary files are never included in permanent database backups.
            </li>
            <li>
              <strong>AI Feedback as Formative Practice Aid:</strong> You acknowledge that automated feedback, scoring rubrics, and AI evaluations represent instructional coaching tools designed solely for educational practice. They do NOT constitute formal employment decisions, certified hiring determinations, or automated legal evaluations. Whitebox Learning makes no representations or warranties regarding the absolute accuracy or predictive validity of AI evaluations for specific employment outcomes. Candidates may request human instructor review or profile correction by contacting <a href="mailto:recruiting@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>.
            </li>
            <li>
              <strong>Differentiated Subprocessor Data Handling:</strong> Candidate spoken audio is processed by speech-to-text transcription APIs transiently in memory to produce text transcripts and is purged within 15 minutes of session completion. Only text transcripts and rubric prompts are transmitted to AI evaluation model subprocessors. Raw video files, biometric facial geometries, and national identification numbers are never sent to AI providers. All AI processing is conducted under enterprise Zero-Data-Retention (ZDR) agreements contractually prohibiting the use of candidate data to train public foundation models.
            </li>
            <li>
              <strong>Consent Audit Records Retention &amp; Pseudonymization:</strong> Pre-assessment consent audit records are retained for a finalized period of three (3) years under Whitebox Learning&apos;s corporate compliance policy based on statutory limitation periods for contract and regulatory compliance defense. Upon candidate account erasure, direct personal identifiers are severed, retaining only a pseudonymized cryptographic hash, assessment UUID, consent choices, and timestamp. The cryptographic salt and lookup keys are stored in an access-restricted enclave for authorized compliance personnel until the 3-year term concludes, at which point both the audit record and cryptographic mapping keys are permanently and irreversibly destroyed.
            </li>
            <li>
              <strong>Human Coaching Discretion:</strong> Human instructors review recordings and automated outputs at their professional discretion; their qualitative mentorship supersedes automated suggestions.
            </li>
          </ul>
        </div>

        {/* Section 5 */}
        <div id="tos-5" className="mb-10 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            5. YouTube API Services Integration, Upload Notices &amp; Data Deletion
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning integrates with and relies upon <strong>YouTube API Services</strong> to provide video hosting, playback, and streaming for assessment sessions and lecture archives. By utilizing video recording, playback, or review features on our platform, you acknowledge and agree to the following terms:
          </p>
          <div className="mb-6 space-y-4 text-gray-800 dark:text-gray-300">
            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                A. Incorporation of YouTube Terms of Service
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Your access to video features is conditioned on your compliance with third-party service terms. You agree to be bound by the{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  YouTube Terms of Service
                </a>
                {" "}and acknowledge the{" "}
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
                B. Unlisted Visibility &amp; User Confidentiality Responsibility
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Candidate assessment recordings uploaded through our system to our institutional channel are configured with YouTube&apos;s &ldquo;Unlisted&rdquo; privacy setting by default. While unlisted videos are excluded from public search results and public channel feeds, <strong>unlisted videos are not private or access-controlled by Google</strong>. Anyone who possesses or receives the direct video URL may view and share the video directly on YouTube without logging in. Within the Whitebox Learning platform, direct links and embedded players are restricted to authenticated candidate accounts and assigned instructors; however, Whitebox Learning never characterizes unlisted videos as &ldquo;private&rdquo; or &ldquo;access-controlled by YouTube.&rdquo; You agree to maintain strict confidentiality and not to distribute, share, or publish your assessment URLs outside authorized Whitebox Learning mentoring channels, and to avoid disclosing sensitive personally identifiable, financial, or proprietary corporate information during mock assessments.
              </p>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                C. Mandatory Upload-Screen Warning &amp; &ldquo;Not Made for Kids&rdquo; Declaration (§9.1)
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                Immediately adjacent to the button or user action that initiates recording submission and upload, the platform displays the mandatory warning required by <strong>Section 9.1 of the YouTube API Services Terms of Service</strong>:
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
                Our application dynamically presents the appropriate URL based on the user device: personal computer and desktop browsers render <span className="font-mono">https://www.youtube.com/t/terms</span>, while mobile device interfaces render <span className="font-mono">http://m.youtube.com/terms</span>. All recorded content submitted for upload must also strictly comply with the{" "}
                <a
                  href="https://www.youtube.com/howyoutubeworks/policies/community-guidelines/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                >
                  YouTube Community Guidelines
                </a>
                {" "}(mobile: <a href="http://m.youtube.com/community_guidelines" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline dark:text-blue-400">http://m.youtube.com/community_guidelines</a>). You expressly represent and warrant that you will not record or upload any content that infringes anyone&apos;s copyright or privacy rights, or contains hate speech, harassment, defamation, nudity, or violence.
              </p>
              <div className="mt-3 rounded border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-700 text-xs leading-relaxed">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Audience Declaration &amp; Prohibition of Child-Directed Content (&ldquo;Made for Kids&rdquo; COPPA Compliance):
                </p>
                <p className="mt-1">
                  Whitebox Learning is an adult career development platform; <strong>child-directed content is strictly prohibited</strong>. In compliance with YouTube API upload requirements for non-child-directed applications:
                </p>
                <ul className="mt-1.5 list-inside list-disc pl-2 space-y-1">
                  <li>Before uploading, candidates must affirmatively confirm the audience declaration: <em>&ldquo;I certify that this technical mock interview recording is Not Made for Kids and contains no child-directed content.&rdquo;</em></li>
                  <li>Candidates electing to upload to their personal YouTube channel receive notice to confirm this &ldquo;Not Made for Kids&rdquo; classification on YouTube Studio desktop (<a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">https://studio.youtube.com</a>) immediately after uploading.</li>
                  <li>Candidates represent and warrant that recordings contain zero child-directed content under COPPA and YouTube Community Guidelines.</li>
                </ul>
              </div>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                D. Candidate Channel Upload Options, Prominence Equity &amp; Visibility Controls (§9.1(a) &amp; §9.1(b))
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                In strict compliance with YouTube API Services Terms of Service Sections 9.1(a) and 9.1(b), Whitebox Learning provides you with explicit choices regarding where your interview recordings are hosted:
              </p>
              <ul className="mt-2 list-inside list-disc pl-2 space-y-1.5 text-sm">
                <li>
                  <strong>Option 1: Upload to Your Own YouTube Channel (§9.1(a)):</strong> You have the option to connect your personal YouTube account via Google OAuth to upload your interview recordings directly to your own personal YouTube channel. In accordance with YouTube API Required Minimum Functionality, our upload interface provides you with controls to choose between Public, Private, and Unlisted visibility. We recommend configuring the upload as &ldquo;Unlisted&rdquo; to allow Whitebox Learning to evaluate your practice session and embed playback in your dashboard via standard YouTube APIs. If you select &ldquo;Private&rdquo;, YouTube restricts external access unless active Google OAuth read permissions are granted and maintained; if OAuth permissions are revoked, expired, or restricted, automated transcription, rubric scoring, and platform playback will be unavailable.
                </li>
                <li>
                  <strong>Option 2: Upload to Whitebox Learning Educational Channel (§9.1(b)):</strong> You may elect to upload your assessment recording to Whitebox Learning&apos;s institutional educational channel as an unlisted video solely for educational rubric scoring and mentor review.
                </li>
                <li>
                  <strong>Equal Prominence Guarantee (§9.1(b)(ii)):</strong> In our application interface, onboarding wizard, and session preferences, the option to upload to your own personal YouTube channel is presented side-by-side and <em>at least as prominently</em> as the option to upload to Whitebox Learning&apos;s institutional channel. Candidates make an affirmative, voluntary selection before any recording or upload occurs; neither option is selected silently by default.
                </li>
                <li>
                  <strong>Ownership Boundary &amp; Limited License Allocation (§9.1(b)(i)):</strong> For all assessment recordings, you retain 100% sole copyright, title, ownership, and moral rights in and to your original audiovisual recordings, voice, spoken answers, and likeness. Whitebox Learning acquires NO ownership rights in your videos. You grant Whitebox Learning a limited, non-exclusive, revocable, royalty-free license solely to capture, temporarily buffer, transcribe, evaluate using automated models, host on YouTube for review (on the institutional or personal channel per your selection), and display your assessment recordings solely to provide you with educational feedback, instructor mentorship, and technical practice evaluation. Candidate transcripts and score reports constitute candidate personal data (exportable while active, purged within 30 days upon deletion request or account closure). Whitebox Learning retains exclusive ownership of its proprietary scoring algorithms, rubric models, question banks, and platform analytics.
                </li>
                <li>
                  <strong>Deterministic 1:1 Indexing:</strong> Every uploaded video is deterministically and uniquely indexed to your individual assessment UUID and candidate identifier, ensuring deletion commands execute solely against your specific record without affecting other candidates or institutional assets.
                </li>
              </ul>
            </div>

            <div className="rounded border-l-4 border-blue-600 bg-white p-4 shadow-sm dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                E. Comprehensive YouTube API Data Deletion Mandate &amp; Operational Reconciliation
              </p>
              <div className="mt-1 text-sm leading-relaxed space-y-3">
                <p>
                  <strong>1. Company 7-Day Deletion Commitment for Stored YouTube API Data:</strong> The official YouTube API Services Developer Policies establish a general outer limit of thirty (30) calendar days for deleting or refreshing stored API data, while requiring prompt deletion upon revocation or qualifying request. Whitebox Learning voluntarily enforces a <strong>stricter company commitment of seven (7) calendar days</strong> to permanently purge candidate-associated stored YouTube API data (YouTube Video IDs, playback URLs, upload confirmation statuses, video titles, and assessment reference mappings) from live production databases, read-replicas, and active caches upon:
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li>Direct candidate deletion request submitted to <a href="mailto:recruiting@whitebox-learning.com" className="font-semibold text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>.</li>
                  <li>Account closure or termination of platform access.</li>
                  <li>In-app client authorization revocation or disconnecting your Google account within the Whitebox Learning portal.</li>
                  <li>Detected external revocation of Whitebox Learning access via the <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 underline dark:text-blue-400">Google Security Permissions Page</a> (e.g. token refresh returning <span className="font-mono">invalid_grant</span>).</li>
                </ul>

                <p>
                  <strong>2. Routine 30-Day API Data Refresh &amp; Expiration (Developer Policy III.E.1):</strong> In compliance with YouTube API Services Developer Policies, Whitebox Learning actively refreshes or deletes stored authorized YouTube API data that is older than thirty (30) calendar days. Scheduled synchronization routines query the YouTube Data API to confirm that stored video IDs and playback metadata remain valid and reflect current YouTube platform state. Any cached YouTube API data that cannot be re-validated or exceeds 30 calendar days without active re-verification is automatically expired and purged from live application storage.
                </p>

                <p>
                  <strong>3. Local Data Deletion vs. Remote Hosted Video Realities:</strong> Deleting local application records does not prove or guarantee that the hosted video has been removed from YouTube. Whitebox Learning enforces separate, verifiable operational tracks:
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li><strong>Institutional Channel Recordings:</strong> For recordings hosted on Whitebox Learning&apos;s institutional channel, our automated pipeline dispatches a <span className="font-mono">videos.delete</span> command via the YouTube Data API. Deletion is confirmed via HTTP 204 or verification query (<span className="font-mono">videos.list</span> returning 404 / empty). If transient errors (HTTP 500, 503, 429) occur, the request is retried with exponential backoff for up to 72 hours. If unresolved at 72 hours, an automated compliance alert escalates to engineering compliance operations under an administrative SLA to execute manual removal on the institutional channel. The internal 72-hour retry window is an operational recovery mechanism for remote video deletion, not an extension of our 7-calendar-day local data purge commitment.</li>
                  <li><strong>Personal Channel Recordings &amp; OAuth Revocation:</strong> For recordings uploaded to your personal YouTube channel, remote deletion via API requires active Google OAuth permissions. If you revoke OAuth access prior to deletion execution, Whitebox Learning has no technical capability or authority to delete videos on your personal channel. In this scenario, all local application data and API references are permanently purged within seven (7) calendar days, your status is marked as <span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span>, and you will be provided written guidance to delete the video directly via <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">YouTube Studio</a>.</li>
                  <li><strong>Independent Status Communication:</strong> The platform tracks and communicates independent statuses: Application Data: <span className="font-mono">LOCAL_DATA_PURGED</span>; Hosted Video: <span className="font-mono">REMOTE_DELETION_CONFIRMED</span> or <span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span>. Severing local database links is never represented as remote video deletion.</li>
                </ul>

                <p>
                  <strong>4. Operational Recovery Tombstone Lifecycle &amp; 7-Day Boundary:</strong> To prevent orphaned remote videos during temporary API outages, an operational recovery tombstone is stored in an isolated administrative table.
                </p>
                <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs">
                  <li><strong>Data Content &amp; Access Restriction:</strong> The tombstone is a restricted operational record containing solely: internal Deletion Job UUID, external YouTube Video ID, attempt counter, timestamp, and HTTP error code. It contains zero candidate personal data, names, or emails, and is accessible strictly to automated deletion workers and compliance administrators.</li>
                  <li><strong>At the 7-Day Boundary:</strong> All candidate-facing application records, profile links, video titles, and assessment references are guaranteed purged within seven (7) calendar days. If a remote deletion call against the institutional channel experiences transient failures, the isolated tombstone persists under the automated retry queue (up to 72 hours) and administrative escalation SLA to complete manual channel removal. In no event is an operational tombstone retained beyond thirty (30) calendar days from the initial request (strictly within YouTube Developer Policy outer limits).</li>
                  <li><strong>Permanent Destruction:</strong> Once remote deletion is confirmed (<span className="font-mono">REMOTE_DELETION_CONFIRMED</span>) or manual institutional channel removal is verified, the tombstone is <strong>immediately and permanently purged</strong>. For personal channel uploads where OAuth was revoked, the tombstone is purged as soon as status is recorded as <span className="font-mono">PENDING_USER_YOUTUBE_ACTION</span> and the user is notified, well within seven (7) calendar days. The platform never silently discards tombstone records prior to remote deletion confirmation or candidate notification.</li>
                </ul>

                <p>
                  <strong>5. Consent Audit Records &amp; Pseudonymized Retention Lifecycle:</strong> Pre-assessment consent audit records are retained for a finalized period of three (3) years under Whitebox Learning&apos;s corporate compliance policy based on statutory limitation periods for contract and regulatory compliance defense. Upon candidate erasure requests, direct personal identifiers (name, email, video URLs) are permanently scrubbed from active systems, retaining only a pseudonymized cryptographic hash, assessment UUID, consent category flags, policy version, and timestamp. The cryptographic salt and lookup keys are maintained in an isolated access-controlled security enclave accessible exclusively by authorized compliance officers and legal counsel during the 3-year term. Upon reaching the conclusion of the 3-year schedule, both the audit record and its associated mapping keys/salt are <strong>permanently and irreversibly destroyed</strong> by automated lifecycle jobs.
                </p>

                <p>
                  <strong>6. Disaster Recovery Backup Reconciliation:</strong> Database disaster recovery snapshots are automated, immutable point-in-time archives maintained on standard rolling retention cycles (up to 30 days). To reconcile archive snapshot immutability with deletion commitments, Whitebox Learning deploys an <strong>Automated Deletion Replay Log</strong>: in the event that an emergency disaster recovery database restoration is performed, the recovery pipeline automatically executes the replay log <em>prior to</em> exposing restored instances to live production network traffic, instantly re-verifying and re-purging any previously deleted YouTube API records. Snapshots age out naturally and permanently after their rolling 30-day lifecycle.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div id="tos-6" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            6. Intellectual Property &amp; Content Ownership Allocation
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning enforces an explicit, clear division of intellectual property and content ownership:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li><strong>Candidate Original Recordings &amp; Likeness:</strong> Practice recordings, audiovisual media, spoken answers, voice, and likeness remain your exclusive property and intellectual content, licensed to Whitebox Learning solely for the assessment and coaching purposes set forth in Section 4 and Section 5. Whitebox Learning acquires no ownership rights in your recordings.</li>
            <li><strong>Candidate Transcripts &amp; Individual Assessment Reports:</strong> Transcripts of your spoken responses and individualized scoring feedback constitute candidate personal data. While enrolled and active, you have the right to view and export your reports. Upon account closure or a verified deletion request, individual transcripts and score reports are permanently purged within thirty (30) days.</li>
            <li><strong>Whitebox Learning Platform Property:</strong> All software, curricula, user interfaces, branding, lecture materials, coding problem sets, assessment rubrics, machine learning prompt templates, scoring algorithms, aggregate benchmarking models, and documentation provided on the Services are the exclusive property of Whitebox Learning, Inc. or its licensors and are protected under United States and international copyright, trademark, and trade secret laws.</li>
          </ul>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            You are granted a limited, personal, non-exclusive, non-transferable, revocable license to access course materials for your individual educational development. You may not copy, record, reverse engineer, decompile, redistribute, or create derivative works from platform curriculum without explicit written consent.
          </p>
        </div>

        {/* Section 7 */}
        <div id="tos-7" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            7. Acceptable Use Policy &amp; Code of Conduct
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            When utilizing the Services, you agree NOT to:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300">
            <li>Upload or transmit audio, video, or content that violates YouTube&apos;s Community Guidelines, contains child-directed material, or is defamatory, obscene, harassing, hateful, or infringing on any third-party intellectual property or privacy right.</li>
            <li>Impersonate any person or entity, or falsify your identity, qualifications, or credentials during simulated interviews or mock exams.</li>
            <li>Introduce viruses, worms, malware, or malicious scripts into our servers or client interfaces.</li>
            <li>Scrape, index, or harvest candidate profiles, curriculum, or platform resources through automated bots or crawlers.</li>
            <li>Circumvent, disable, or tamper with security protocols, rate limits, or YouTube API integration controls.</li>
            <li>Use the Services to develop a competing automated interview evaluation platform.</li>
          </ul>
        </div>

        {/* Section 8 */}
        <div id="tos-8" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            8. Commercial Terms &amp; Tuition
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Fees for enrollment in training courses and mock interview packages are established during registration. All fees are quoted in U.S. Dollars. Unless explicitly stated in a signed enrollment agreement, payments are non-refundable once curriculum access has commenced.
          </p>
        </div>

        {/* Section 9 */}
        <div id="tos-9" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            9. Third-Party Integrations &amp; Subprocessors
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            The Services incorporate integrations with third-party tools, including YouTube API Services, cloud storage infrastructure, speech-to-text transcription APIs, and artificial intelligence model endpoints. Speech transcription APIs process audio transiently in memory solely to produce text transcripts and do not retain candidate audio. AI evaluation model endpoints receive only text transcripts and rubric context under enterprise Zero-Data-Retention commitments and are prohibited from training public models. Your interactions with third-party platforms are also governed by their respective terms and policies.
          </p>
        </div>

        {/* Section 10 */}
        <div id="tos-10" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            10. Data Retention, Storage Lifecycle &amp; Deletion Schedules
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Whitebox Learning enforces an authoritative, synchronized data retention and deletion schedule aligned with our Privacy Policy:
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
                  <td className="px-6 py-4">Automated lifecycle purge job. Upon candidate erasure, records are pseudonymized (direct identifiers scrubbed, retaining cryptographic hash, UUID, timestamp, policy version). Access is restricted to compliance and legal officers. Keys and records are irreversibly purged at end of 3-year term.</td>
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

        {/* Section 11 */}
        <div id="tos-11" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            11. Warranty Disclaimers &amp; As-Is Nature
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300 uppercase font-semibold text-sm">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AND WITHOUT LIMITING YOUR NON-WAIVABLE STATUTORY RIGHTS, THE SERVICES, INCLUDING ALL AI PREP ASSESSMENTS, TRANSCRIPTIONS, RUBRICS, AND YOUTUBE INTEGRATED PLAYBACK, ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WHITEBOX LEARNING DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            WHITEBOX LEARNING DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, NOR DOES IT GUARANTEE EMPLOYMENT, JOB PLACEMENT, OR INTERVIEW OUTCOMES RESULTING FROM USE OF THE SERVICES.
          </p>
        </div>

        {/* Section 12 */}
        <div id="tos-12" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            12. Limitation of Liability &amp; Statutory Savings Clause
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300 uppercase font-semibold text-sm">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AND WITHOUT LIMITING ANY NON-WAIVABLE STATUTORY CONSUMER PROTECTIONS APPLICABLE IN YOUR JURISDICTION, IN NO EVENT SHALL WHITEBOX LEARNING, INC., ITS DIRECTORS, EMPLOYEES, AFFILIATES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA LOSS, LOSS OF GOODWILL, OR BUSINESS INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            IN NO EVENT SHALL WHITEBOX LEARNING&apos;S TOTAL AGGREGATE LIABILITY EXCEED THE AMOUNT PAID BY YOU, IF ANY, TO WHITEBOX LEARNING FOR ACCESSING OR USING THE SERVICES IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.
          </p>
        </div>

        {/* Section 13 */}
        <div id="tos-13" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            13. Indemnification
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            To the maximum extent permitted by applicable law, you agree to defend, indemnify, and hold harmless Whitebox Learning, Inc., its officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to: (a) your violation of these Terms; (b) your violation of any third-party right, including intellectual property, privacy, or publicity rights; or (c) any content or recordings submitted under your account in violation of YouTube Community Guidelines.
          </p>
        </div>

        {/* Section 14 */}
        <div id="tos-14" className="mb-10 rounded-lg border border-amber-300 bg-amber-50 p-6 dark:border-amber-900 dark:bg-gray-800">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            14. Dispute Resolution, Governing Law &amp; Arbitration
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Governing Law:</strong> These Terms and any dispute arising out of or related to your use of the Services shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Mandatory Informal Negotiation:</strong> Prior to initiating arbitration or legal proceedings, both parties agree to attempt in good faith to resolve any dispute informally for at least thirty (30) days by submitting written notice to <a href="mailto:recruiting@whitebox-learning.com" className="text-blue-600 underline dark:text-blue-400">recruiting@whitebox-learning.com</a>.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Binding Arbitration:</strong> To the maximum extent permitted by applicable law, if unresolved informally, any dispute, controversy, or claim arising out of or relating to these Terms shall be settled by binding arbitration administered by the American Arbitration Association (&ldquo;AAA&rdquo;) under its Commercial Arbitration Rules. The arbitration shall take place in Alameda County, California, or via remote videoconference.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300 font-bold uppercase text-sm">
            Class Action Waiver: TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AND WHITEBOX LEARNING AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
          </p>
        </div>

        {/* Section 15 */}
        <div id="tos-15" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            15. Term, Termination &amp; Deletion Commitments
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            These Terms remain in full effect while you access or use the Services. Whitebox Learning reserves the right, in its sole discretion and without prior notice, to suspend or terminate your account and access to the Services for conduct that violates these Terms, infringes intellectual property rights, or harms other users or the platform.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            Upon termination or account closure, your right to access the Services immediately ceases. All authorized YouTube API Data stored locally will be permanently purged across active databases, caches, and read-replicas as soon as possible and strictly within seven (7) calendar days under Whitebox Learning&apos;s corporate commitment, and within statutory limits of up to thirty (30) days under YouTube Developer Policies. In ordinary course, assessment transcripts and evaluation reports are retained for enrollment plus twelve (12) months for student career mentorship; however, upon account closure or a verified deletion request, all transcripts, AI feedback, and assessment records are permanently purged within thirty (30) days, subject only to narrow statutory legal hold exceptions. Consent audit records are retained in pseudonymized format for a finalized period of three (3) years under Whitebox Learning corporate policy based on statutory limitation periods, then irreversibly destroyed along with mapping keys. Sections 4, 5, 6, 10, 11, 12, 13, 14, and 16 shall survive termination.
          </p>
        </div>

        {/* Section 16 */}
        <div id="tos-16" className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            16. Modifications &amp; General Legal Inquiries
          </h3>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Modifications:</strong> We reserve the right to modify these Terms at any time. Material revisions will become effective upon posting or notification via email. Your continued use of the Services following posted changes signifies your binding acceptance of the updated Terms.
          </p>
          <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300">
            <strong>Severability &amp; Entire Agreement:</strong> If any provision of these Terms is held invalid or unenforceable, that provision will be modified to the minimum extent necessary, and the remaining provisions will continue in full force. These Terms constitute the entire agreement between you and Whitebox Learning regarding the Services.
          </p>
          <div className="rounded-md bg-gray-50 p-4 font-mono text-sm dark:bg-gray-700 space-y-0.5">
            <div><strong>Whitebox Learning, Inc. — Legal Inquiries</strong></div>
            <div>Attn: Legal Department</div>
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
