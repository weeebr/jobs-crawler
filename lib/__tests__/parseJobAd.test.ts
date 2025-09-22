import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

import { parseJobAd } from "../parseJobAd";

const fixturePath = join(__dirname, "fixtures", "java-fullstack-erp.html");
const SAMPLE_HTML = readFileSync(fixturePath, "utf-8");

describe("parseJobAd", () => {
  it("extracts core job metadata", async () => {
    const job = await parseJobAd(SAMPLE_HTML, {
      sourceUrl: "https://www.jobs.ch/en/vacancies/detail/aaf5733e-e476-4c6b-8993-498de105ec02/",
    });

    expect(job.title).toBe("Java Fullstack Developer - ERP und Web Technologien (m/w/d) - Job Offer at Rocken® - jobs.ch");
    expect(job.company).toBe("Rocken®");
    expect(job.sourceUrl).toBe("https://www.jobs.ch/en/vacancies/detail/aaf5733e-e476-4c6b-8993-498de105ec02/");
    expect(job.stack).toContain("Java");
    expect(job.stack).toContain("Angular");
    expect(job.stack.length).toBeGreaterThan(3);
    expect(job.qualifications.length + job.roles.length).toBeGreaterThanOrEqual(3);
    expect(job.publishedAt).toBeDefined();
  });

  it("handles compact metadata labels without separators", async () => {
    const compactHtml = `
      <html>
        <head>
          <title>Cloud Engineer @ Aproda</title>
          <meta property="og:title" content="Cloud Engineer" />
          <meta property="og:site_name" content="Aproda AG" />
        </head>
        <body>
          <main>
            <h1>Cloud Engineer</h1>
            <section>
              <p>
                Workload:80 – 100%Contract type:Unlimited employmentPlace of work:Grenzstrasse 20A, 3250 Lyss
              </p>
            </section>
          </main>
        </body>
      </html>
    `;

    const job = await parseJobAd(compactHtml, {
      sourceUrl: "https://aproda.ch/jobs/cloud-engineer",
    });

    expect(job.workload).toBe("80 – 100%");
    expect(job.duration).toBe("Unlimited");
  });
});
