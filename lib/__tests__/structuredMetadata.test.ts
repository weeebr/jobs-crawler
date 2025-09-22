import { describe, test, expect } from "vitest";
import { load } from "cheerio";
import { extractEnhancedMetadata } from "../jobAd/metadata/structuredExtractor";

describe("Structured Metadata Extraction", () => {
  const jobsChHtml = `
    <ul class="li-t_none pl_s0 mb_s0 mt_s0 d_grid gap_s16 grid-tc_[auto] sm:grid-tc_[1fr_1fr] md:grid-tc_[1fr] pb_s24">
      <li data-cy="info-publication" class="ai_flex-start d_flex">
        <span class="flex_[0_0_24px] mr_s8 icon icon--iconSize_sm">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%">
            <path d="M2 10c0-1.467.296-2.854.888-4.162A9.715 9.715 0 0 1 5.425 2.45l1.425 1.4a8.37 8.37 0 0 0-2.1 2.762A7.834 7.834 0 0 0 4 10H2zm18 0c0-1.2-.25-2.33-.75-3.388a8.37 8.37 0 0 0-2.1-2.762l1.425-1.4c1.1.95 1.946 2.08 2.538 3.388A9.988 9.988 0 0 1 22 10h-2zM4 19v-2h2v-7c0-1.383.417-2.613 1.25-3.688.833-1.075 1.917-1.779 3.25-2.112v-.7c0-.417.146-.77.438-1.062A1.444 1.444 0 0 1 12 2c.417 0 .77.146 1.062.438.292.291.438.645.438 1.062v.7c1.333.333 2.417 1.037 3.25 2.112C17.583 7.387 18 8.617 18 10v7h2v2H4zm8 3c-.55 0-1.02-.196-1.412-.587A1.927 1.927 0 0 1 10 20h4a1.93 1.93 0 0 1-.587 1.413A1.928 1.928 0 0 1 12 22zm-4-5h8v-7c0-1.1-.392-2.042-1.175-2.825C14.042 6.392 13.1 6 12 6s-2.042.392-2.825 1.175C8.392 7.958 8 8.9 8 10v7z"></path>
          </svg>
        </span>
        <div class="">
          <span class="d_inline-block fw_semibold mr_s8">Publication date:</span>
          <span class="white-space_nowrap">02 September 2025</span>
        </div>
      </li>
      <li data-cy="info-workload" class="ai_flex-start d_flex">
        <span class="flex_[0_0_24px] mr_s8 icon icon--iconSize_sm">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%">
            <path d="M10 3a.965.965 0 0 1-.712-.288A.965.965 0 0 1 9 2c0-.283.096-.521.288-.713A.967.967 0 0 1 10 1h4a.97.97 0 0 1 .713.287A.97.97 0 0 1 15 2a.97.97 0 0 1-.287.712A.968.968 0 0 1 14 3h-4zm2 11a.968.968 0 0 0 .713-.288A.967.967 0 0 0 13 13V9a.97.97 0 0 0-.287-.713A.97.97 0 0 0 12 8a.967.967 0 0 0-.712.287A.968.968 0 0 0 11 9v4c0 .283.096.52.288.712A.965.965 0 0 0 12 14zm0 8a8.654 8.654 0 0 1-3.488-.712A9.2 9.2 0 0 1 5.65 19.35a9.202 9.202 0 0 1-1.938-2.862A8.655 8.655 0 0 1 3 13a8.65 8.65 0 0 1 .712-3.488A9.202 9.202 0 0 1 5.65 6.65a9.188 9.188 0 0 1 2.862-1.937A8.644 8.644 0 0 1 12 4a8.92 8.92 0 0 1 2.975.5c.95.333 1.842.817 2.675 1.45l.725-.725a.918.918 0 0 1 .675-.275c.267 0 .5.1.7.3a.948.948 0 0 1 .275.7.948.948 0 0 1-.275.7l-.7.7a9.723 9.723 0 0 1 1.45 2.675c.333.95.5 1.942.5 2.975a8.654 8.654 0 0 1-.712 3.488 9.201 9.201 0 0 1-1.938 2.862 9.201 9.201 0 0 1-2.862 1.938A8.654 8.654 0 0 1 12 22zm0-2c1.933 0 3.583-.683 4.95-2.05C18.317 16.583 19 14.933 19 13c0-1.933-.683-3.583-2.05-4.95C15.583 6.683 13.933 6 12 6c-1.933 0-3.583.683-4.95 2.05C5.683 9.417 5 11.067 5 13c0 1.933.683 3.583 2.05 4.95C8.417 19.317 10.067 20 12 20z"></path>
          </svg>
        </span>
        <div class="">
          <span class="d_inline-block fw_semibold mr_s8">Workload:</span>
          <span class="white-space_nowrap">60 – 100%</span>
        </div>
      </li>
      <li data-cy="info-contract" class="ai_flex-start d_flex">
        <span class="flex_[0_0_24px] mr_s8 icon icon--iconSize_sm">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%">
            <path d="M9 18h6a.968.968 0 0 0 .713-.288A.967.967 0 0 0 16 17a.967.967 0 0 0-.287-.712A.968.968 0 0 0 15 16H9a.965.965 0 0 0-.712.288A.965.965 0 0 0 8 17c0 .283.096.52.288.712A.965.965 0 0 0 9 18zm0-4h6a.968.968 0 0 0 .713-.288A.967.967 0 0 0 16 13a.97.97 0 0 0-.287-.713A.97.97 0 0 0 15 12H9a.967.967 0 0 0-.712.287A.968.968 0 0 0 8 13c0 .283.096.52.288.712A.965.965 0 0 0 9 14zm-3 8c-.55 0-1.02-.196-1.412-.587A1.927 1.927 0 0 1 4 20V4c0-.55.196-1.021.588-1.413A1.925 1.925 0 0 1 6 2h8.175a1.978 1.978 0 0 1 1.4.575l3.85 3.85a1.978 1.978 0 0 1 .575 1.4V20c0 .55-.196 1.021-.587 1.413A1.928 1.928 0 0 1 18 22H6zm8-15V4H6v16h12V8h-3a.965.965 0 0 1-.712-.288A.965.965 0 0 1 14 7z"></path>
          </svg>
        </span>
        <div class="">
          <span class="d_inline-block fw_semibold mr_s8">Contract type:</span>
          <span class="">Unlimited employment</span>
        </div>
      </li>
      <li data-cy="info-language" class="ai_flex-start d_flex">
        <span class="flex_[0_0_24px] mr_s8 icon icon--iconSize_sm">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%">
            <path d="M12 22a9.671 9.671 0 0 1-3.875-.788 10.126 10.126 0 0 1-3.187-2.15 10.125 10.125 0 0 1-2.15-3.187A9.67 9.67 0 0 1 2 12a9.64 9.64 0 0 1 .788-3.887 10.164 10.164 0 0 1 2.15-3.175 10.14 10.14 0 0 1 3.187-2.151A9.681 9.681 0 0 1 12 2a9.65 9.65 0 0 1 3.887.787 10.178 10.178 0 0 1 3.175 2.151 10.164 10.164 0 0 1 2.15 3.175A9.64 9.64 0 0 1 22 12a9.671 9.671 0 0 1-.788 3.875 10.125 10.125 0 0 1-2.15 3.187 10.164 10.164 0 0 1-3.175 2.15A9.64 9.64 0 0 1 12 22zm0-2.05c.433-.6.808-1.225 1.125-1.875.317-.65.575-1.342.775-2.075h-3.8c.2.733.458 1.425.775 2.075.317.65.692 1.275 1.125 1.875zm-2.6-.4a13.84 13.84 0 0 1-.787-1.713A14.607 14.607 0 0 1 8.05 16H5.1a8.304 8.304 0 0 0 1.812 2.175A7.2 7.2 0 0 0 9.4 19.55zm5.2 0a7.19 7.19 0 0 0 2.487-1.375A8.295 8.295 0 0 0 18.9 16h-2.95c-.15.633-.337 1.246-.562 1.837a13.89 13.89 0 0 1-.788 1.713zM4.25 14h3.4a13.365 13.365 0 0 1-.15-2 13.365 13.365 0 0 1 .15-2h-3.4A8.012 8.012 0 0 0 4 12a8.012 8.012 0 0 0 .25 2zm5.4 0h4.7a13.35 13.35 0 0 0 .15-2 13.35 13.35 0 0 0-.15-2h-4.7a13.584 13.584 0 0 0-.15 2 13.018 13.018 0 0 0 .15 2zm6.7 0h3.4a8.018 8.018 0 0 0 .25-2 8.018 8.018 0 0 0-.25-2h-3.4a13.6 13.6 0 0 1 .15 2 13.033 13.033 0 0 1-.15 2zm-.4-6h2.95a8.294 8.294 0 0 0-1.813-2.175A7.19 7.19 0 0 0 14.6 4.45c.3.55.563 1.12.788 1.712.225.592.412 1.205.562 1.838zM10.1 8h3.8a11.82 11.82 0 0 0-.775-2.075A12.701 12.701 0 0 0 12 4.05c-.433.6-.808 1.225-1.125 1.875A11.82 11.82 0 0 0 10.1 8zm-5 0h2.95c.15-.633.338-1.246.563-1.838C8.838 5.571 9.1 5 9.4 4.45a7.2 7.2 0 0 0-2.488 1.375A8.303 8.303 0 0 0 5.1 8z"></path>
          </svg>
        </span>
        <div class="">
          <span class="d_inline-block fw_semibold mr_s8">Language:</span>
          <span class="">German (Fluent), English (Intermediate)</span>
        </div>
      </li>
      <li class="ai_flex-start d_flex">
        <span class="flex_[0_0_24px] mr_s8 icon icon--iconSize_sm">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%">
            <path d="M12 12c.55 0 1.021-.196 1.413-.588.391-.391.587-.862.587-1.412a1.93 1.93 0 0 0-.587-1.413A1.928 1.928 0 0 0 12 8c-.55 0-1.02.196-1.412.587A1.927 1.927 0 0 0 10 10c0 .55.196 1.02.588 1.412.391.392.862.588 1.412.588zm0 7.35c2.033-1.867 3.542-3.563 4.525-5.088C17.508 12.737 18 11.383 18 10.2c0-1.817-.58-3.304-1.738-4.463C15.104 4.579 13.683 4 12 4c-1.683 0-3.104.579-4.263 1.737C6.579 6.896 6 8.383 6 10.2c0 1.183.492 2.537 1.475 4.062.983 1.525 2.492 3.221 4.525 5.088zM12 22c-2.683-2.283-4.687-4.404-6.012-6.363C4.663 13.679 4 11.867 4 10.2c0-2.5.804-4.492 2.413-5.975C8.021 2.742 9.883 2 12 2c2.117 0 3.979.742 5.587 2.225C19.196 5.708 20 7.7 20 10.2c0 1.667-.662 3.479-1.987 5.437-1.325 1.959-3.33 4.08-6.013 6.363z"></path>
          </svg>
        </span>
        <div class="">
          <span class="d_inline-block fw_semibold mr_s8">Place of work:</span>
          <a href="https://www.google.com/maps/search/?api=1&amp;query=47.34771%2C7.88881" rel="noopener nofollow" data-cy="info-location-link" target="_blank" class="cursor_pointer trs-dur_d125 trs-prop_color trs-tmf_ease-out td_none hover:td_underline c_colorPalette.base hover:c_colorPalette.hover visited:c_colorPalette.visited color-palette_link.brand">Solothurnerstrasse 235, 4600&nbsp;Olten<span class="ml_s4 icon icon--iconSize_xs"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%"><path d="M5 21a1.93 1.93 0 0 1-1.413-.587A1.928 1.928 0 0 1 3 19V5c0-.55.196-1.021.587-1.413A1.928 1.928 0 0 1 5 3h7v2H5v14h14v-7h2v7a1.93 1.93 0 0 1-.587 1.413A1.928 1.928 0 0 1 19 21H5zm4.7-5.3l-1.4-1.4L17.6 5H14V3h7v7h-2V6.4l-9.3 9.3z"></path></svg></span></a>
        </div>
      </li>
      <li data-cy="info-salary_estimate" class="ai_flex-start d_flex">
        <span class="flex_[0_0_24px] mr_s8 icon icon--iconSize_sm">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%">
            <path d="m16 13.5c.433 0 .792-.142 1.075-.425s.425-.642.425-1.075-.142-.792-.425-1.075-.642-.425-1.075-.425-.792.142-1.075.425-.425.642-.425 1.075.142.792.425 1.075.642.425 1.075.425zm-11 5.5v-14zm0 2c-.55 0-1.021-.196-1.413-.587a1.928 1.928 0 0 1 -.587-1.413v-14c0-.55.196-1.021.587-1.413a1.928 1.928 0 0 1 1.413-.587h14c.55 0 1.021.196 1.413.587.391.392.587.863.587 1.413v2.5h-2v-2.5h-14v14h14v-2.5h2v2.5c0 .55-.196 1.021-.587 1.413a1.928 1.928 0 0 1 -1.413.587zm8-4c-.55 0-1.02-.196-1.412-.587a1.927 1.927 0 0 1 -.588-1.413v-6c0-.55.196-1.021.588-1.413a1.925 1.925 0 0 1 1.412-.587h7c.55 0 1.021.196 1.413.587.391.392.587.863.587 1.413v6c0 .55-.196 1.021-.587 1.413a1.928 1.928 0 0 1 -1.413.587zm7-2v-6h-7v6z"></path>
          </svg>
        </span>
        <div class="">
          <span class="d_inline-block fw_semibold mr_s8">Salary estimate from jobs.ch<!-- -->:</span>
          <div class="d_flex">
            <div class="pos_relative notranslate">
              <span role="button" tabindex="0" childrenprops="[object Object]" class="cursor_pointer cursor_pointer trs-dur_d125 trs-prop_color trs-tmf_ease-out td_none hover:td_underline c_colorPalette.base hover:c_colorPalette.hover visited:c_colorPalette.visited color-palette_link.brand">CHF 75 050 - 115 050/year (100% workload)<span class="ml_s4 icon icon--iconSize_sm"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="fill_[currentColor] h_100% w_100%"><path d="M12 17a.968.968 0 0 0 .713-.288A.967.967 0 0 0 13 16v-4.025a.928.928 0 0 0-.287-.7A.993.993 0 0 0 12 11a.967.967 0 0 0-.712.287A.968.968 0 0 0 11 12v4.025c0 .283.096.517.288.7A.99.99 0 0 0 12 17zm0-8a.968.968 0 0 0 .713-.288A.967.967 0 0 0 13 8a.97.97 0 0 0-.287-.713A.97.97 0 0 0 12 7a.967.967 0 0 0-.712.287A.968.968 0 0 0 11 8c0 .283.096.52.288.712A.965.965 0 0 0 12 9zm0 13a9.733 9.733 0 0 1-3.9-.788 10.092 10.092 0 0 1-3.175-2.137c-.9-.9-1.612-1.958-2.137-3.175A9.733 9.733 0 0 1 2 12a9.74 9.74 0 0 1 .788-3.9 10.092 10.092 0 0 1 2.137-3.175c.9-.9 1.958-1.613 3.175-2.138A9.743 9.743 0 0 1 12 2a9.74 9.74 0 0 1 3.9.787 10.105 10.105 0 0 1 3.175 2.138c.9.9 1.612 1.958 2.137 3.175A9.733 9.733 0 0 1 22 12a9.733 9.733 0 0 1-.788 3.9 10.092 10.092 0 0 1-2.137 3.175c-.9.9-1.958 1.612-3.175 2.137A9.733 9.733 0 0 1 12 22zm0-2c2.217 0 4.104-.779 5.663-2.337C19.221 16.104 20 14.217 20 12s-.779-4.104-2.337-5.663C16.104 4.779 14.217 4 12 4s-4.104.779-5.662 2.337C4.779 7.896 4 9.783 4 12s.78 4.104 2.338 5.663C7.896 19.221 9.783 20 12 20z"></path></svg></span></span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  `;

  test("extracts structured metadata from jobs.ch HTML", () => {
    const $ = load(jobsChHtml);
    const text = $.text();
    const metadata = extractEnhancedMetadata($, jobsChHtml, text);

    expect(metadata.workload).toBe("60 – 100%");
    expect(metadata.duration).toBe("Unlimited");
    expect(metadata.language).toBe("German (Fluent), English (Intermediate)");
    expect(metadata.location?.replace(/\u00A0/g, ' ')).toBe("Solothurnerstrasse 235, 4600 Olten");
    expect(metadata.publishedAt).toBe("02 September 2025");
    expect(metadata.salary).toBe("CHF 75 050 - 115 050/year (100% workload)");
  });

  test("falls back to semantic extraction for non-structured HTML", () => {
    const fallbackHtml = `
      <div>
        <p>Workload: 80%</p>
        <p>Contract type: Permanent</p>
        <p>Language: English (Fluent)</p>
        <p>Location: Zurich, Switzerland</p>
      </div>
    `;
    
    const $ = load(fallbackHtml);
    const text = $.text();
    const metadata = extractEnhancedMetadata($, fallbackHtml, text);

    expect(metadata.workload).toBe("80%");
    expect(metadata.duration).toBe("Permanent");
    expect(metadata.language).toBe("English (Fluent)");
    expect(metadata.location).toBe("Zurich, Switzerland");
  });
});
