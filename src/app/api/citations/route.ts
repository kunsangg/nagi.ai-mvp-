import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "cited_by"; // "cited_by" | "references"
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "25");

  if (!id) {
    return NextResponse.json({ error: "Missing paper id" }, { status: 400 });
  }

  try {
    let url: string;

    if (type === "references") {
      // Papers this work references
      url = `https://api.openalex.org/works?filter=cited_by:${id}&per_page=${perPage}&page=${page}&sort=cited_by_count:desc`;
    } else {
      // Papers that cite this work
      url = `https://api.openalex.org/works?filter=cites:${id}&per_page=${perPage}&page=${page}&sort=cited_by_count:desc`;
    }

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();

    const papers = (data.results || []).map((w: any) => {
      let abstract = "";
      if (w.abstract_inverted_index) {
        const inv = w.abstract_inverted_index;
        const max = Math.max(...(Object.values(inv).flat() as number[]));
        const words = new Array(max + 1).fill("");
        for (const [word, positions] of Object.entries(inv)) {
          for (const pos of positions as number[]) words[pos] = word;
        }
        abstract = words.join(" ").trim();
      }

      return {
        id: w.id?.replace("https://openalex.org/", "") || "",
        title: w.title || "Untitled",
        authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
        publicationYear: w.publication_year,
        citationCount: w.cited_by_count || 0,
        journal: w.primary_location?.source?.display_name,
        doi: w.doi?.replace("https://doi.org/", ""),
        isOpenAccess: w.open_access?.is_oa || false,
        abstract: abstract.slice(0, 300),
        type: w.type,
        topics: (w.topics || []).slice(0, 3).map((t: any) => ({
          displayName: t.display_name,
          score: t.score,
        })),
      };
    });

    return NextResponse.json({
      papers,
      totalCount: data.meta?.count || 0,
      page,
      perPage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch citations", details: err.message },
      { status: 500 }
    );
  }
}
