import { load } from "cheerio";
import { filterEmptyValue, filterDurationValue } from "./filterUtils";
import { normalizeLocationLabel } from "./locationUtils";
import { transformEmploymentType } from "./employmentTypeExtractor";

export interface StructuredMetadata {
  workload?: string;
  duration?: string;
  language?: string;
  location?: string;
  publishedAt?: string;
  salary?: string;
  companySize?: string;
}

// Extract metadata from structured HTML using data attributes and semantic selectors
export function extractStructuredMetadata(
  $: ReturnType<typeof load>,
): StructuredMetadata {
  const metadata: StructuredMetadata = {};

  // Extract workload using data-cy attribute (jobs.ch specific)
  const workloadElement = $('[data-cy="info-workload"]');
  if (workloadElement.length) {
    const workloadText = workloadElement.find('span:contains("Workload:")').next().text().trim();
    const filtered = filterEmptyValue(workloadText);
    if (filtered) {
      metadata.workload = filtered;
    }
  }

  // Extract contract type using data-cy attribute
  const contractElement = $('[data-cy="info-contract"]');
  if (contractElement.length) {
    const contractText = contractElement.find('span:contains("Contract type:")').next().text().trim();
    const filtered = filterDurationValue(contractText);
    if (filtered) {
      // Transform employment type to remove common suffixes
      const transformed = transformEmploymentType(filtered);
      const finalFiltered = filterDurationValue(transformed);
      if (finalFiltered) {
        metadata.duration = finalFiltered;
      }
    }
  }

  // Extract language requirements
  const languageElement = $('[data-cy="info-language"]');
  if (languageElement.length) {
    const languageText = languageElement.find('span:contains("Language:")').next().text().trim();
    const filtered = filterEmptyValue(languageText);
    if (filtered) {
      metadata.language = filtered;
    }
  }

  // Extract location
  const locationElement = $('[data-cy="info-location-link"]');
  if (locationElement.length) {
    const locationText = locationElement.text().trim();
    const filtered = filterEmptyValue(locationText);
    if (filtered) {
      const normalized = normalizeLocationLabel(filtered);
      if (normalized) {
        metadata.location = normalized;
      }
    }
  }

  // Extract publication date
  const publicationElement = $('[data-cy="info-publication"]');
  if (publicationElement.length) {
    const publicationText = publicationElement.find('span:contains("Publication date:")').next().text().trim();
    const filtered = filterEmptyValue(publicationText);
    if (filtered) {
      metadata.publishedAt = filtered;
    }
  }

  // Extract salary estimate
  const salaryElement = $('[data-cy="info-salary_estimate"]');
  if (salaryElement.length) {
    const salaryText = salaryElement.find('span:contains("Salary estimate")').next().text().trim();
    const filtered = filterEmptyValue(salaryText);
    if (filtered) {
      metadata.salary = filtered;
    }
  }

  // Extract company size from structured metadata; support legacy team labels
  const companySizeElement = $('[data-cy="info-company_size"], [data-cy="info-team_size"]');
  if (companySizeElement.length) {
    const companySizeText = companySizeElement
      .find('span:contains("Company size:"), span:contains("Team size:")')
      .next()
      .text()
      .trim();
    const filtered = filterEmptyValue(companySizeText);
    if (filtered) {
      metadata.companySize = filtered;
      console.info(`[extractStructuredMetadata] found companySize: "${filtered}"`);
    }
  }

  return metadata;
}
