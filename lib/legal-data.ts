export interface Definition {
  term: string
  plainMeaning: string
  example: string
  importance: string
}

export interface Question {
  question: string
  answer: string
  clauseReference?: string
}

export interface Clause {
  id: string
  clauseNumber: string
  title: string
  humanTitle: string
  subtitle: string
  originalText: string
  plainMeaning: string
  whyMatters: string[]
  riskLevel: "low" | "medium" | "high"
  favors: string
  commonness: string
  notableCharacteristics?: string[]
  definitions?: Definition[]
  questions?: Question[]
}

export const clauses: Clause[] = [
  {
    id: "clause-1",
    clauseNumber: "§ 1",
    title: "Definitions",
    humanTitle: "Key Terms",
    subtitle: "Establishing the vocabulary of the agreement",
    originalText: `1.1 "Affiliate" means any entity that directly or indirectly controls, is controlled by, or is under common control with a party, where "control" means ownership of more than fifty percent (50%) of the voting securities or equivalent voting interest.

1.2 "Confidential Information" means any non-public information disclosed by either party to the other, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.

1.3 "Licensed Software" means the proprietary software application(s) specified in Exhibit A, including any Updates provided during the Subscription Term.

1.4 "Updates" means any error corrections, patches, bug fixes, updates, upgrades, new versions, releases, or other modifications to the Licensed Software that Licensor makes generally available to its customers at no additional charge.`,
    plainMeaning:
      "This section defines the key terms used throughout the agreement. Understanding these definitions is essential because they determine the scope and boundaries of each party's rights and obligations.",
    whyMatters: [
      "The definition of 'Affiliate' determines which related companies can use the software",
      "The broad definition of 'Confidential Information' means most business communications may be protected",
      "Updates are included at no extra cost during your subscription",
    ],
    riskLevel: "low",
    favors: "Neutral",
    commonness: "Standard",
    definitions: [
      {
        term: "Affiliate",
        plainMeaning: "Companies that are owned by or share ownership with the main company",
        example: "If Company A owns 60% of Company B, then Company B is an Affiliate of Company A",
        importance: "Determines whether subsidiaries can use the licensed software",
      },
      {
        term: "Confidential Information",
        plainMeaning: "Private business information that should not be shared publicly",
        example: "Trade secrets, customer lists, pricing strategies, or technical documentation",
        importance: "Creates legal obligations to protect the other party's sensitive information",
      },
    ],
    questions: [
      {
        question: "Does this include future updates?",
        answer:
          "Yes, the definition of 'Updates' explicitly includes new versions and upgrades made generally available during your subscription period.",
        clauseReference: "including any Updates provided during the Subscription Term",
      },
    ],
  },
  {
    id: "clause-2",
    clauseNumber: "§ 2",
    title: "Grant of License",
    humanTitle: "What You Can Do",
    subtitle: "The permissions granted under this agreement",
    originalText: `2.1 License Grant. Subject to the terms and conditions of this Agreement and payment of applicable fees, Licensor hereby grants to Licensee a non-exclusive, non-transferable, non-sublicensable license to install and use the Licensed Software solely for Licensee's internal business purposes during the Subscription Term.

2.2 Usage Restrictions. Licensee shall not: (a) copy, modify, or create derivative works of the Licensed Software; (b) reverse engineer, disassemble, or decompile the Licensed Software; (c) rent, lease, loan, sell, sublicense, or otherwise transfer the Licensed Software to any third party; (d) use the Licensed Software for the benefit of any third party; or (e) remove any proprietary notices or labels from the Licensed Software.

2.3 Reservation of Rights. Licensor reserves all rights not expressly granted herein. No rights are granted by implication, estoppel, or otherwise.`,
    plainMeaning:
      "You are being granted permission to use the software for your own business purposes only. This is not a transfer of ownership—you're essentially renting access to the software under specific conditions.",
    whyMatters: [
      "You cannot share the software with other companies or use it to provide services to third parties",
      "Modifications to the software are prohibited",
      "The license is tied to your subscription—it ends when you stop paying",
    ],
    riskLevel: "low",
    favors: "Licensor",
    commonness: "Standard",
    notableCharacteristics: [
      "Non-transferable license prevents sale or assignment",
      "Internal use only restriction limits commercial service offerings",
    ],
    questions: [
      {
        question: "Can I modify the software?",
        answer:
          "No, the agreement explicitly prohibits copying, modifying, or creating derivative works of the Licensed Software.",
        clauseReference: "shall not: (a) copy, modify, or create derivative works",
      },
      {
        question: "Can my subsidiaries use it?",
        answer:
          "This would depend on whether they qualify as Affiliates under Section 1.1 and whether the license scope extends to Affiliates. Based on this clause alone, usage is limited to 'Licensee's internal business purposes.'",
      },
    ],
  },
  {
    id: "clause-3",
    clauseNumber: "§ 3",
    title: "Fees and Payment",
    humanTitle: "Payment Terms",
    subtitle: "Financial obligations and payment schedule",
    originalText: `3.1 Fees. Licensee shall pay the fees set forth in the applicable Order Form. All fees are quoted and payable in United States Dollars unless otherwise specified.

3.2 Payment Terms. Unless otherwise agreed in the Order Form, all invoices are due and payable within thirty (30) days of the invoice date. Licensee shall pay interest on all late payments at the rate of 1.5% per month, or the highest rate permissible under applicable law, whichever is less.

3.3 Taxes. All fees are exclusive of taxes. Licensee is responsible for paying all applicable taxes, excluding taxes based on Licensor's income. If Licensor is required to collect or pay any such taxes, they will be invoiced to Licensee.

3.4 No Refunds. Except as expressly set forth herein, all fees paid are non-refundable and all commitments to pay fees are non-cancelable.`,
    plainMeaning:
      "You must pay the agreed fees within 30 days of receiving an invoice. Late payments incur interest charges, and you're responsible for any applicable sales or use taxes.",
    whyMatters: [
      "Late payments trigger a 1.5% monthly interest charge (18% annually)",
      "Fees are non-refundable once paid",
      "Tax obligations are separate from the quoted price",
    ],
    riskLevel: "medium",
    favors: "Licensor",
    commonness: "Standard",
    notableCharacteristics: [
      "Non-refundable fee structure limits flexibility",
      "Interest rate on late payments is relatively high",
    ],
    definitions: [
      {
        term: "Order Form",
        plainMeaning: "The document specifying the specific products, quantities, and pricing you've agreed to",
        example: "A signed document listing 50 user licenses at $100/month each",
        importance: "The Order Form controls the specific financial terms of your deal",
      },
    ],
    questions: [
      {
        question: "Can I get a refund if I cancel early?",
        answer: "No, the agreement states that 'all fees paid are non-refundable' and commitments are non-cancelable.",
        clauseReference: "all fees paid are non-refundable",
      },
    ],
  },
  {
    id: "clause-4",
    clauseNumber: "§ 4",
    title: "Confidentiality",
    humanTitle: "Information Protection",
    subtitle: "Obligations to protect sensitive business information",
    originalText: `4.1 Protection of Confidential Information. Each party agrees to: (a) maintain the confidentiality of the other party's Confidential Information using at least the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care; (b) not disclose such Confidential Information to any third party except as permitted herein; and (c) use such Confidential Information only for purposes of exercising its rights or performing its obligations under this Agreement.

4.2 Permitted Disclosures. A party may disclose Confidential Information to its employees, contractors, and agents who have a need to know such information and who are bound by confidentiality obligations at least as protective as those contained herein.

4.3 Exclusions. Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was rightfully known to the receiving party prior to disclosure; (c) is rightfully obtained from a third party without breach of any confidentiality obligation; or (d) is independently developed without use of the disclosing party's Confidential Information.

4.4 Duration. The obligations of confidentiality shall survive for a period of five (5) years following the termination or expiration of this Agreement.`,
    plainMeaning:
      "Both parties must protect each other's confidential business information and can only use it for purposes related to this agreement. These obligations continue for 5 years after the contract ends.",
    whyMatters: [
      "Your sensitive business data will be protected by the same standards you use",
      "The 5-year post-termination period is longer than some industry standards",
      "Employees and contractors can access confidential information if properly bound",
    ],
    riskLevel: "low",
    favors: "Neutral",
    commonness: "Standard",
    questions: [
      {
        question: "How long do these obligations last?",
        answer: "The confidentiality obligations continue for 5 years after the agreement ends.",
        clauseReference: "survive for a period of five (5) years following the termination",
      },
      {
        question: "Can I share information with my lawyers?",
        answer:
          "Yes, you can share with contractors and agents who have a need to know, provided they are bound by similar confidentiality obligations.",
      },
    ],
  },
  {
    id: "clause-5",
    clauseNumber: "§ 5",
    title: "Intellectual Property",
    humanTitle: "Ownership Rights",
    subtitle: "Who owns what under this agreement",
    originalText: `5.1 Licensor IP. As between the parties, Licensor owns and retains all right, title, and interest in and to the Licensed Software, including all intellectual property rights therein. Licensee's rights to the Licensed Software are limited to the license expressly granted in Section 2.

5.2 Feedback. If Licensee provides any suggestions, ideas, enhancement requests, feedback, or recommendations regarding the Licensed Software ("Feedback"), Licensor may use and incorporate such Feedback into its products and services without any obligation to Licensee.

5.3 Licensee Data. As between the parties, Licensee owns and retains all right, title, and interest in and to all data, content, and information that Licensee inputs into or generates through the Licensed Software ("Licensee Data").`,
    plainMeaning:
      "The software vendor owns the software; you own your data. However, any suggestions or feedback you provide can be used by the vendor without compensation to you.",
    whyMatters: [
      "You maintain ownership of all your business data",
      "Any product suggestions become the vendor's property",
      "The license does not transfer any ownership rights to you",
    ],
    riskLevel: "low",
    favors: "Neutral",
    commonness: "Standard",
    definitions: [
      {
        term: "Feedback",
        plainMeaning: "Any suggestions or ideas you share about improving the product",
        example: "Requesting a new feature or reporting a usability issue with suggested solutions",
        importance: "The vendor can use your ideas without paying you or giving credit",
      },
      {
        term: "Licensee Data",
        plainMeaning: "All the information and content you create or store using the software",
        example: "Customer records, reports, documents, and any other data you enter",
        importance: "Establishes clear ownership of your business information",
      },
    ],
  },
  {
    id: "clause-6",
    clauseNumber: "§ 6",
    title: "Warranties",
    humanTitle: "Guarantees & Promises",
    subtitle: "What the vendor promises about the software",
    originalText: `6.1 Performance Warranty. Licensor warrants that, during the Subscription Term, the Licensed Software will perform materially in accordance with the applicable documentation.

6.2 Warranty Remedy. As Licensee's sole and exclusive remedy for any breach of the warranty in Section 6.1, Licensor will, at its option, either: (a) repair or replace the non-conforming Licensed Software; or (b) refund the fees paid for the non-conforming Licensed Software and terminate this Agreement.

6.3 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH IN THIS SECTION 6, THE LICENSED SOFTWARE IS PROVIDED "AS IS" AND LICENSOR MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.`,
    plainMeaning:
      "The vendor only guarantees that the software will work as described in its documentation. If it doesn't, your only remedy is a repair, replacement, or refund—you cannot sue for damages.",
    whyMatters: [
      "The warranty is limited to basic functionality as documented",
      "No guarantee that the software fits your specific needs",
      "Remedies are limited to fixing the software or getting your money back",
    ],
    riskLevel: "medium",
    favors: "Licensor",
    commonness: "Standard",
    notableCharacteristics: [
      "AS IS disclaimer significantly limits vendor liability",
      "Sole remedy provision restricts legal options",
    ],
    questions: [
      {
        question: "What if the software doesn't work?",
        answer:
          "The vendor will either repair it, replace it, or refund your fees. These are your only options—you cannot pursue other damages.",
        clauseReference: "sole and exclusive remedy",
      },
    ],
  },
  {
    id: "clause-7",
    clauseNumber: "§ 7",
    title: "Indemnification",
    humanTitle: "Legal Protection Responsibilities",
    subtitle: "Who pays if something goes wrong",
    originalText: `7.1 Indemnification by Licensor. Licensor shall defend, indemnify, and hold harmless Licensee from and against any third-party claim alleging that the Licensed Software infringes any patent, copyright, or trade secret, and shall pay any damages finally awarded or settlement amounts agreed to, provided that Licensee: (a) gives Licensor prompt written notice of the claim; (b) grants Licensor sole control over the defense and settlement; and (c) provides reasonable assistance in the defense.

7.2 Indemnification by Licensee. Licensee shall defend, indemnify, and hold harmless Licensor from and against any third-party claim arising from: (a) Licensee's use of the Licensed Software in violation of this Agreement; (b) Licensee Data; or (c) Licensee's products or services. Licensee shall pay any damages finally awarded or settlement amounts agreed to.

7.3 Exclusive Remedy. THIS SECTION 7 STATES THE ENTIRE LIABILITY AND OBLIGATIONS OF THE PARTIES, AND THE EXCLUSIVE REMEDY OF THE INDEMNIFIED PARTY, WITH RESPECT TO ANY THIRD-PARTY CLAIMS ARISING FROM THIS AGREEMENT.`,
    plainMeaning:
      "If someone sues claiming the software violates their intellectual property, the vendor must defend you. However, if someone sues because of how you used the software or because of your data, you must defend the vendor.",
    whyMatters: [
      "Financial responsibility could be significant if your data or usage causes a lawsuit",
      "You must give the vendor control over any IP-related defense",
      "This is the only recourse for third-party claims—other legal theories are excluded",
    ],
    riskLevel: "high",
    favors: "Licensor",
    commonness: "Aggressive",
    notableCharacteristics: [
      "Broad licensee indemnification for data-related claims",
      "Vendor controls all IP defense decisions including settlements",
      "Exclusive remedy provision limits legal options significantly",
    ],
    definitions: [
      {
        term: "Indemnify",
        plainMeaning: "To compensate someone for harm or loss; to protect against legal liability",
        example: "If a third party sues and wins $100,000, the indemnifying party pays that amount",
        importance: "Creates significant potential financial exposure",
      },
      {
        term: "Hold Harmless",
        plainMeaning: "To protect someone from being held legally responsible",
        example: "Even if sued, the protected party won't bear the legal costs or damages",
        importance: "Transfers risk from one party to another",
      },
    ],
    questions: [
      {
        question: "When does this apply?",
        answer:
          "Licensor's indemnification applies when third parties claim the software itself infringes their IP. Licensee's indemnification applies when claims arise from how you used the software, your data, or your products/services.",
        clauseReference: "third-party claim arising from",
      },
      {
        question: "How broad is this obligation?",
        answer:
          "Quite broad. You're responsible for any claims related to your data, your use of the software, and your own products—even if the claim seems tangentially related.",
        clauseReference: "Licensee Data; or (c) Licensee's products or services",
      },
      {
        question: "Is this typical?",
        answer:
          "The indemnification scope is more aggressive than typical market terms. Many agreements limit data-related indemnification to willful misconduct or specific violations.",
      },
    ],
  },
  {
    id: "clause-8",
    clauseNumber: "§ 8",
    title: "Limitation of Liability",
    humanTitle: "Caps on Financial Responsibility",
    subtitle: "Maximum liability exposure for each party",
    originalText: `8.1 Exclusion of Damages. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER SUCH PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

8.2 Liability Cap. EXCEPT FOR A PARTY'S INDEMNIFICATION OBLIGATIONS OR A PARTY'S BREACH OF SECTION 4 (CONFIDENTIALITY), EACH PARTY'S TOTAL CUMULATIVE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID BY LICENSEE DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

8.3 Basis of the Bargain. THE PARTIES AGREE THAT THE LIMITATIONS OF LIABILITY SET FORTH IN THIS SECTION 8 ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN THE PARTIES.`,
    plainMeaning:
      "Neither party can recover indirect damages like lost profits. The maximum either party can be liable for is generally limited to one year's worth of fees you've paid.",
    whyMatters: [
      "Lost profits and consequential damages are not recoverable",
      "Maximum exposure is capped at 12 months of fees",
      "Indemnification obligations are excluded from the cap—potentially unlimited liability",
    ],
    riskLevel: "high",
    favors: "Licensor",
    commonness: "Standard structure, aggressive carve-outs",
    notableCharacteristics: [
      "Indemnification excluded from liability cap creates unlimited exposure",
      "All consequential damages waived regardless of cause",
      "Low cap relative to potential business impact",
    ],
    definitions: [
      {
        term: "Consequential Damages",
        plainMeaning: "Indirect losses that result from a breach, like lost business opportunities",
        example: "If software downtime causes you to lose a $1M contract, that lost contract is consequential damages",
        importance: "These are often the largest damages in commercial disputes but are waived here",
      },
    ],
    questions: [
      {
        question: "What's the maximum I could owe?",
        answer:
          "For most claims, one year of fees. However, indemnification obligations and confidentiality breaches have no cap, meaning potential liability could be unlimited.",
        clauseReference: "EXCEPT FOR A PARTY'S INDEMNIFICATION OBLIGATIONS",
      },
    ],
  },
  {
    id: "clause-9",
    clauseNumber: "§ 9",
    title: "Term and Termination",
    humanTitle: "Duration & Ending the Agreement",
    subtitle: "How long this lasts and how it can end",
    originalText: `9.1 Term. This Agreement commences on the Effective Date and continues for the initial Subscription Term specified in the Order Form. Thereafter, the Agreement will automatically renew for successive renewal periods equal to the initial Subscription Term unless either party provides written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.

9.2 Termination for Cause. Either party may terminate this Agreement: (a) upon thirty (30) days' written notice if the other party materially breaches this Agreement and fails to cure such breach within the notice period; or (b) immediately upon written notice if the other party becomes insolvent, makes an assignment for the benefit of creditors, or becomes subject to bankruptcy proceedings.

9.3 Effect of Termination. Upon termination or expiration: (a) all licenses granted herein shall immediately terminate; (b) Licensee shall cease all use of the Licensed Software and destroy all copies; (c) each party shall return or destroy the other party's Confidential Information; and (d) Licensee shall pay all fees due through the termination date.

9.4 Survival. Sections 1, 4, 5, 7, 8, 10, and 11 shall survive any termination or expiration of this Agreement.`,
    plainMeaning:
      "The agreement automatically renews unless you give 30 days' notice. Either party can terminate for serious breach or bankruptcy. When it ends, you lose access to the software and must pay all outstanding fees.",
    whyMatters: [
      "Auto-renewal means you could be locked into another term if you miss the notice window",
      "30-day cure period gives time to fix breaches before termination",
      "Key obligations like confidentiality and indemnification survive termination",
    ],
    riskLevel: "medium",
    favors: "Licensor",
    commonness: "Standard",
    notableCharacteristics: [
      "Auto-renewal requires proactive cancellation",
      "Short 30-day non-renewal window may be easy to miss",
    ],
    questions: [
      {
        question: "How do I cancel?",
        answer:
          "You must provide written notice at least 30 days before the end of your current term. Otherwise, the agreement automatically renews.",
        clauseReference: "at least thirty (30) days prior to the end",
      },
      {
        question: "What obligations continue after termination?",
        answer:
          "Confidentiality (5 years), indemnification, limitation of liability, intellectual property ownership, and governing law provisions all survive termination.",
      },
    ],
  },
  {
    id: "clause-10",
    clauseNumber: "§ 10",
    title: "Governing Law and Disputes",
    humanTitle: "Legal Jurisdiction",
    subtitle: "Where and how disputes will be resolved",
    originalText: `10.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.

10.2 Dispute Resolution. Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules. The arbitration shall be conducted in Wilmington, Delaware. The arbitrator's decision shall be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.

10.3 Injunctive Relief. Notwithstanding the foregoing, either party may seek injunctive or other equitable relief from any court of competent jurisdiction to protect its intellectual property rights or Confidential Information.`,
    plainMeaning:
      "Delaware law applies to this agreement. Most disputes must go through private arbitration rather than court, except for urgent matters involving intellectual property or confidential information.",
    whyMatters: [
      "Arbitration is private and typically faster than court, but may limit your legal options",
      "Delaware is a business-friendly jurisdiction often favoring corporate interests",
      "You give up the right to a jury trial for most disputes",
    ],
    riskLevel: "medium",
    favors: "Licensor",
    commonness: "Standard",
    notableCharacteristics: [
      "Mandatory arbitration limits litigation options",
      "Delaware venue may require travel for disputes",
    ],
    questions: [
      {
        question: "Can I sue in court?",
        answer:
          "Only for injunctive relief to protect intellectual property or confidential information. All other disputes must go through binding arbitration.",
        clauseReference: "binding arbitration",
      },
    ],
  },
  {
    id: "clause-11",
    clauseNumber: "§ 11",
    title: "General Provisions",
    humanTitle: "Miscellaneous Terms",
    subtitle: "Administrative and interpretive provisions",
    originalText: `11.1 Entire Agreement. This Agreement, together with any Order Forms and exhibits, constitutes the entire agreement between the parties and supersedes all prior or contemporaneous agreements, understandings, and communications.

11.2 Amendment. This Agreement may only be amended by a written instrument signed by both parties.

11.3 Assignment. Licensee may not assign this Agreement without Licensor's prior written consent, except in connection with a merger, acquisition, or sale of all or substantially all of Licensee's assets. Licensor may assign this Agreement without restriction.

11.4 Waiver. No failure or delay by either party in exercising any right shall constitute a waiver of that right.

11.5 Severability. If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.

11.6 Notices. All notices must be in writing and delivered by overnight courier or certified mail to the addresses specified in the Order Form.`,
    plainMeaning:
      "This is the complete agreement—prior discussions don't count. Changes require written signatures. You need permission to transfer this agreement, but the vendor can transfer it freely.",
    whyMatters: [
      "Any promises made during sales discussions are not binding unless in this document",
      "Assignment restrictions may complicate business transactions",
      "Written notice requirements create important procedural obligations",
    ],
    riskLevel: "low",
    favors: "Licensor",
    commonness: "Standard",
    questions: [
      {
        question: "Can verbal promises be enforced?",
        answer:
          "No, the entire agreement clause means only what's written in this document is binding. Prior discussions or verbal commitments are superseded.",
        clauseReference: "supersedes all prior or contemporaneous agreements",
      },
      {
        question: "What if my company is acquired?",
        answer:
          "Assignment is permitted in connection with a merger, acquisition, or sale of substantially all assets, without needing prior consent.",
        clauseReference: "except in connection with a merger, acquisition",
      },
    ],
  },
]
