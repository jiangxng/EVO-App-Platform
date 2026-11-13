export const BUSINESS_DICTIONARY_PACKAGE_ID = "evo-business-dictionary" as const;
export const BUSINESS_DICTIONARY_FEATURE_ID = "evo-business-dictionary.default" as const;
export const BUSINESS_DICTIONARY_CAPABILITY_V010 = "enterprise.business-dictionary" as const;

export const BUSINESS_DICTIONARY_LIST_COMMAND_V010 = "dictionary.list" as const;
/** CV-01: optional bounded READ collection; legacy dictionary.list is unchanged. */
export const BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010 = "dictionary.collection.query" as const;
 /** CV-06: domain-owned, full-authorized-set aggregate READ; not chart/UI/WRITE. */
 export const BUSINESS_DICTIONARY_COLLECTION_STATE_AGGREGATE_COMMAND_V010 =
   "dictionary.collection.aggregate.state" as const;
/** CV-04: current authorized Dictionary Collection page download; not bulk export. */
export const BUSINESS_DICTIONARY_PAGE_CSV_EXPORT_COMMAND_V010 = "dictionary.collection.page.export.csv" as const;
export const BUSINESS_DICTIONARY_DRAFT_COMMAND_V010 = "dictionary.draft.save" as const;
export const BUSINESS_DICTIONARY_OPTION_SAVE_COMMAND_V010 = "dictionary.option.draft.save" as const;
export const BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010 = "dictionary.publish" as const;
export const BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010 = "dictionary.resolve.batch" as const;

export const BUSINESS_DICTIONARY_READ_ACTION_V010 = "dictionary.read" as const;
export const BUSINESS_DICTIONARY_WRITE_ACTION_V010 = "dictionary.write" as const;
export const BUSINESS_DICTIONARY_PUBLISH_ACTION_V010 = "dictionary.publish" as const;
export const BUSINESS_DICTIONARY_AUTH_RESOURCE_V010 = "business-dictionary.definition" as const;

export const BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010 = "/business-dictionaries" as const;
export const BUSINESS_DICTIONARY_DETAIL_ROUTE_V010 = "/business-dictionaries/view" as const;
export const BUSINESS_DICTIONARY_OPTION_ROUTE_V010 = "/business-dictionaries/option" as const;
export const BUSINESS_DICTIONARY_DIRECTORY_SOURCE_V010 = "app://evo-business-dictionary/pages/directory" as const;
export const BUSINESS_DICTIONARY_DETAIL_SOURCE_V010 = "app://evo-business-dictionary/pages/detail" as const;
export const BUSINESS_DICTIONARY_OPTION_SOURCE_V010 = "app://evo-business-dictionary/pages/option" as const;
