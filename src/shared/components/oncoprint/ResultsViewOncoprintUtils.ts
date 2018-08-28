import {CoverageInformation} from "../../../pages/resultsView/ResultsViewPageStoreUtils";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";
import {OncoprintClinicalAttribute} from "./ResultsViewOncoprint";
import {SpecialAttribute} from "../../cache/OncoprintClinicalDataCache";
import _ from "lodash";
import naturalSort from "javascript-natural-sort";

export const alterationTypeToProfiledForText:{[alterationType:string]:string} = {
    "MUTATION_EXTENDED": "mutations",
    "COPY_NUMBER_ALTERATION": "copy number alterations",
    "MRNA_EXPRESSION": "mRNA expression",
    "PROTEIN_LEVEL": "protein expression"
};

export function makeProfiledInClinicalAttributes(
    coverageInformation: CoverageInformation["samples"],
    molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile},
    selectedMolecularProfiles: MolecularProfile[],
    isSingleStudyQuery: boolean
) {
    // determine which Profiled In clinical attributes will exist in this query.
    // A Profiled In <alteration type> attribute only exists if theres a sample in the query
    //  which is not profiled in any selected profiles for that type.

    // If its a single study query (isSingleStudyQuery), and there is only one profile of a particular alteration type
    //  in the study, then an attribute will be generated specifically for that profile. Otherwise, the attribute
    //  will represent an entire alteration type.

    const groupedSelectedMolecularProfiles:{[alterationType:string]:MolecularProfile[]} =
        _.groupBy(selectedMolecularProfiles, "molecularAlterationType");
    const selectedMolecularProfilesMap = _.keyBy(selectedMolecularProfiles, p=>p.molecularProfileId);

    const existsUnprofiled:{[alterationType:string]:boolean} = _.reduce(coverageInformation, (map, sampleCoverage)=>{
        for (const gpData of sampleCoverage.notProfiledAllGenes) {
            if (gpData.molecularProfileId in selectedMolecularProfilesMap) {
                // mark existsUnprofiled for this type because this is a selected profile
                map[
                    molecularProfileIdToMolecularProfile[gpData.molecularProfileId].molecularAlterationType
                ] = true;
            }
        }
        _.forEach(sampleCoverage.notProfiledByGene, (geneInfo)=>{
            for (const gpData of geneInfo) {
                if (gpData.molecularProfileId in selectedMolecularProfilesMap) {
                    // mark existsUnprofiled for this type because this is a selected profile
                    map[
                        molecularProfileIdToMolecularProfile[gpData.molecularProfileId].molecularAlterationType
                    ] = true;
                }
            }
        });
        return map;
    }, {} as {[alterationType:string]:boolean});

    // make a clinical attribute for each profile type which not every sample is profiled in
    const attributes:OncoprintClinicalAttribute[] = (Object.keys(existsUnprofiled).map(alterationType=>{
        const group = groupedSelectedMolecularProfiles[alterationType];
        if (!group) {
            // No selected profiles of that type, skip it
            return null;
        } else if (group.length === 1 && isSingleStudyQuery) {
            // If only one profile of type, and its a single study query, then it gets its own attribute
            const profile = group[0];
            return {
                clinicalAttributeId: `${SpecialAttribute.Profiled}_${profile.molecularProfileId}`,
                datatype: "STRING",
                description: `Profiled in ${profile.name}: ${profile.description}`,
                displayName: `Profiled in ${profile.name}`,
                molecularProfileIds: [profile.molecularProfileId],
                patientAttribute: false
            };
        } else {
            // If more than one, or its multiple study query, make one attribute for the entire alteration type
            return {
                clinicalAttributeId: `${SpecialAttribute.Profiled}_${alterationType}`,
                datatype: "STRING",
                description: "",
                displayName: `Profiled for ${alterationTypeToProfiledForText[alterationType]}`,
                molecularProfileIds: group.map(p=>p.molecularProfileId),
                patientAttribute: false
            };
        }
    }) as (OncoprintClinicalAttribute|null)[]).filter(x=>!!x) as OncoprintClinicalAttribute[];// filter out null

    attributes.sort((a,b)=>naturalSort(a.displayName, b.displayName));
    return attributes;
}