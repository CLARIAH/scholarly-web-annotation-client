<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs fn owl saxon"
    version="3.0"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:hi="http://boot.huygens.knaw.nl/vgdemo1/editionannotationontology.ttl#"
    xmlns:vg="http://boot.huygens.knaw.nl/vgdemo1/vangoghannotationontology.ttl#"
    xmlns:owl="http://www.w3.org/2002/07/owl"
    xmlns:saxon="http://saxon.sf.net/" 
    extension-element-prefixes="saxon">
    
    <xsl:variable name="root" select="."/>
    <xsl:variable name="docuri" select="fn:document-uri()"/>
    
    <xsl:character-map name="amp">
        <xsl:output-character character="&#038;" string="&amp;"/>
    </xsl:character-map>

    <xsl:variable name="processes">
        <processes>
            <process>
                <step path="tei:div[@type='original']" typeofw="vg:Letter" typeofr="hi:EditionText" association="hi:hasRepresentation"
                    matchPattern="([a-z]+).([0-9]+)" 
                    replacementPattern="urn:vangogh/letter=$2" replacementPatternr="urn:vangogh/letter=$2:repr=$1"/>
                <step path="tei:ab" typeofw="vg:ParagraphInLetter" typeofr="hi:EditionText"  propertyw="hi:hasWorkPart" propertyr="hi:hasTextPart" association="hi:hasRepresentation"
                    matchPattern="([a-z]+).([0-9]+).([0-9]+)" 
                    replacementPattern="urn:vangogh/letter=$2:para=$3" replacementPatternr="urn:vangogh/letter=$2:para=$3:repr=$1"/>
            </process>
            <process>
                <step path="tei:div[@type='translation']" typeofw="vg:Letter" typeofr="vg:TranslatedEditionText" association="hi:hasRepresentation"
                    matchPattern="([a-z]+).([0-9]+)" replacementPattern="urn:vangogh/letter=$2" replacementPatternr="urn:vangogh/letter=$2:repr=$1"/>
                <step path="tei:ab" typeofw="vg:ParagraphInLetter" typeofr="vg:TranslatedEditionText" propertyw="hi:hasWorkPart" propertyr="hi:hasTextPart" association="hi:hasRepresentation"
                    matchPattern="([a-z]+).([0-9]+).([0-9]+)" 
                    replacementPattern="urn:vangogh/letter=$2:para=$3" replacementPatternr="urn:vangogh/letter=$2:para=$3:repr=$1"/>
            </process>
        </processes>
    </xsl:variable>
    
    <xsl:template match="/">
        <xsl:result-document href="let001plusrdf.xml" method="xml" use-character-maps="amp">
            <xsl:text>&#10;</xsl:text>
            <saxon:doctype>
                <dtd:doctype name="any" xmlns:dtd="http://saxon.sf.net/dtd" xsl:exclude-result-prefixes="dtd">
                    <dtd:entity name="hi">'http://boot.huygens.knaw.nl/vgdemo1/editionannotationontology.ttl#'</dtd:entity>
                    <dtd:entity name="vg">'http://boot.huygens.knaw.nl/vgdemo1/vangoghannotationontology.ttl#'</dtd:entity>
                </dtd:doctype>
            </saxon:doctype>
            <xsl:text>&#10;</xsl:text>
            <xsl:comment><xsl:text>#Generated on </xsl:text>
            <xsl:value-of select="current-dateTime()"/>
            <xsl:text>.</xsl:text>
            <xsl:text>&#10;</xsl:text>
            <xsl:text>From </xsl:text>
            <xsl:value-of select="$docuri"/></xsl:comment>
            <xsl:apply-templates mode="copy"/>
        </xsl:result-document>
    </xsl:template>
    
    <xsl:template match="@*|node()" mode="copy">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()" mode="copy"/>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="tei:div|tei:ab[ancestor::tei:div[@type='original' or @type='translation']]" mode="copy">
        <xsl:copy>
            <xsl:apply-templates select="@*" mode="copy"/>
            <xsl:variable name="stepnum" as="xs:integer">
                <xsl:choose>
                    <xsl:when test="local-name()='div'">1</xsl:when>
                    <xsl:otherwise>2</xsl:otherwise>
                </xsl:choose>
            </xsl:variable>
            <xsl:variable name="urls" select="vg:expandptr(@xml:id,
                $processes//process[1]/step[$stepnum]/@matchPattern,
                $processes//process[1]/step[$stepnum]/@replacementPattern,
                $processes//process[1]/step[$stepnum]/@replacementPatternr)"/>
            <xsl:attribute name="ontRef">
                <xsl:value-of select="vg:entity-abbrev($urls[1])"/>
                <xsl:text> </xsl:text>
                <xsl:value-of select="vg:entity-abbrev($urls[2])"/>
            </xsl:attribute>
            <xsl:apply-templates select="node()" mode="copy"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="tei:teiHeader" mode="copy">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()" mode="copy"/>
            <tei:xenodata>
                <rdf:RDF xmlns:hi="http://boot.huygens.knaw.nl/vgdemo1/editionannotationontology.ttl#"
                    xmlns:vg="http://boot.huygens.knaw.nl/vgdemo1/vangoghannotationontology.ttl#"
                    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                    xmlns:owl="http://www.w3.org/2002/07/owl">
                    <xsl:for-each select="$processes//process">
                        <xsl:call-template name="process">
                            <xsl:with-param name="stepnum" select="1"/>
                            <xsl:with-param name="process" select="."/>
                            <xsl:with-param name="parentnode" select="$root"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </rdf:RDF>
            </tei:xenodata>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template name="process">
        <xsl:param name="process"/>
        <xsl:param name="stepnum"/>
        <xsl:param name="parentnode"/>
        <xsl:param name="parenturis"/>
        <xsl:variable name="startpath">
            <xsl:text>$parentnode//</xsl:text>
            <xsl:value-of select="$process/step[$stepnum]/@path"/>
        </xsl:variable>
        <xsl:variable name="xpathout">
            <xsl:evaluate xpath="$startpath">
                <xsl:with-param name="parentnode" select="$parentnode"/>
            </xsl:evaluate>
        </xsl:variable>
        <xsl:for-each select="$xpathout/*">
            <xsl:variable name="urls" select="vg:expandptr(@xml:id,
                $process/step[$stepnum]/@matchPattern,
                $process/step[$stepnum]/@replacementPattern,
                $process/step[$stepnum]/@replacementPatternr)"/>
            <xsl:call-template name="vg:writettlline">
                <xsl:with-param name="s">
                    <xsl:value-of select="vg:enclose($urls[1])"/>
                </xsl:with-param>
                <xsl:with-param name="p">rdf:type</xsl:with-param>
                <xsl:with-param name="o"><xsl:value-of select="$process/step[$stepnum]/@typeofw"/></xsl:with-param>
            </xsl:call-template>
            <xsl:call-template name="vg:writettlline">
                <xsl:with-param name="s">
                    <xsl:value-of select="vg:enclose($urls[2])"/>
                </xsl:with-param>
                <xsl:with-param name="p">rdf:type</xsl:with-param>
                <xsl:with-param name="o"><xsl:value-of select="$process/step[$stepnum]/@typeofr"/></xsl:with-param>
            </xsl:call-template>
            <xsl:call-template name="vg:writettlline">
                <xsl:with-param name="s">
                    <xsl:value-of select="vg:enclose($urls[1])"/>
                </xsl:with-param>
                <xsl:with-param name="p"><xsl:value-of select="$process/step[$stepnum]/@association"/></xsl:with-param>
                <xsl:with-param name="o"><xsl:value-of select="vg:enclose($urls[2])"/></xsl:with-param>
            </xsl:call-template>
            <xsl:if test="$parenturis">
                <xsl:call-template name="vg:writettlline">
                    <xsl:with-param name="s">
                        <xsl:value-of select="vg:enclose($parenturis[1])"/>
                    </xsl:with-param>
                    <xsl:with-param name="p"><xsl:value-of select="$process/step[$stepnum]/@propertyw"/></xsl:with-param>
                    <xsl:with-param name="o"><xsl:value-of select="vg:enclose($urls[1])"/></xsl:with-param>
                </xsl:call-template>
                <xsl:call-template name="vg:writettlline">
                    <xsl:with-param name="s">
                        <xsl:value-of select="vg:enclose($parenturis[2])"/>
                    </xsl:with-param>
                    <xsl:with-param name="p"><xsl:value-of select="$process/step[$stepnum]/@propertyr"/></xsl:with-param>
                    <xsl:with-param name="o"><xsl:value-of select="vg:enclose($urls[2])"/></xsl:with-param>
                </xsl:call-template>
            </xsl:if>
            <xsl:if test="count($process/step) > $stepnum">
                <xsl:call-template name="process">
                    <xsl:with-param name="stepnum" select="$stepnum + 1"/>
                    <xsl:with-param name="process" select="$process"/>
                    <xsl:with-param name="parentnode" select="."/>
                    <xsl:with-param name="parenturis" select="$urls"/>
                </xsl:call-template>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="vg:writettlline">
        <xsl:param name="s"/>
        <xsl:param name="p"/>
        <xsl:param name="o"/>
        <xsl:text>&#10;</xsl:text>
        <rdf:Description about="{vg:entity-abbrev(vg:unenclose($s))}">
            <xsl:attribute name="{$p}" select="vg:entity-abbrev(vg:unenclose($o))"></xsl:attribute>
        </rdf:Description>
    </xsl:template>

    <xsl:function name="vg:enclose">
        <xsl:param name="in"/>
        <xsl:text>&lt;</xsl:text>
        <xsl:value-of select="$in"/>
        <xsl:text>&gt;</xsl:text>
    </xsl:function>
    
    <xsl:function name="vg:unenclose">
        <xsl:param name="in"/>
        <xsl:choose>
            <xsl:when test="fn:starts-with($in,'&lt;')  and fn:ends-with($in,'&gt;')">
                <xsl:value-of select="fn:substring($in,2,fn:string-length($in) - 2)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$in"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="vg:entity-abbrev">
        <xsl:param name="in"/>
        <xsl:choose>
            <xsl:when test="fn:starts-with($in,'hi:')">
                <xsl:text>&amp;hi;</xsl:text>
                <xsl:value-of select="fn:substring($in,4)"/>
            </xsl:when>
            <xsl:when test="fn:starts-with($in,'vg:')">
                <xsl:text>&amp;vg;</xsl:text>
                <xsl:value-of select="fn:substring($in,4)"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$in"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="vg:expandptr">
        <xsl:param name="id"/>
        <xsl:param name="mp"/>
        <xsl:param name="rp"/>
        <xsl:param name="rpr"/>
<!--        <xsl:message>
            <xsl:value-of select="$id"/>
            <xsl:text>&#10;</xsl:text>
            <xsl:value-of select="$mp"/>
            <xsl:text>&#10;</xsl:text>
            <xsl:value-of select="$rp"/>
            <xsl:text>&#10;</xsl:text>
            <xsl:value-of select="$rpr"/>
        </xsl:message>
-->        <xsl:variable name="short" select="substring-after($id,'.')"/>
        <xsl:sequence>
            <xsl:value-of select="fn:replace($short,$mp,$rp)"/>
            <xsl:value-of select="fn:replace($short,$mp,$rpr)"/>
        </xsl:sequence>
    </xsl:function>
    
    

</xsl:stylesheet>